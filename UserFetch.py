from flask import request, jsonify, make_response
from flask_restx import Namespace, Resource, fields
from bson import ObjectId
from pymongo import MongoClient
from config import Config
import jwt
from functools import wraps
from datetime import datetime
import re
import html
from dateutil.parser import parse
from dateutil.relativedelta import relativedelta
import base64
import binascii
import io
from PIL import Image
import gridfs

# MongoDB setup
client = MongoClient(Config.MONGO_URI)
db = client.get_database()  # Use the database from MongoDB URI (Aley)
users = db.users

# Set up GridFS for storing images
fs = gridfs.GridFS(db)

# JWT decorator để bảo vệ các route
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            # Lấy token từ header "Bearer <token>"
            if ' ' in auth_header:
                token = auth_header.split(' ')[1]
            else:
                token = auth_header
        
        if not token:
            return {'message': 'Token is missing'}, 401
        
        try:
            # Giải mã token
            payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
            current_user_id = payload['user_id']
        except jwt.ExpiredSignatureError:
            return {'message': 'Token has expired'}, 401
        except jwt.InvalidTokenError:
            return {'message': 'Invalid token'}, 401
        
        return f(current_user_id, *args, **kwargs)
    
    return decorated

def register_routes(api):
    # Tạo namespace
    user_ns = Namespace('api/users', description='User operations')
    
    # Models
    user_profile_model = api.model('UserProfile', {
        'fullName': fields.String(description='User full name'),
        'email': fields.String(description='User email'),
        'dateOfBirth': fields.String(description='User date of birth'),
        'avatar': fields.String(description='User avatar ID'),
        'background': fields.String(description='User background image ID'),
        'verifiedTick': fields.Boolean(description='Verified status'),
        'profile-bio': fields.String(description='User bio')
    })
    
    user_update_model = api.model('UserUpdate', {
        'fullName': fields.String(description='User full name', required=False),
        'dateOfBirth': fields.String(description='User date of birth', required=False),
        'avatar': fields.String(description='Base64 encoded avatar image', required=False),
        'background': fields.String(description='Base64 encoded background image', required=False),
        'profile-bio': fields.String(description='User bio', required=False)
    })
    
    # Response models
    success_response = api.model('SuccessResponse', {
        'success': fields.Boolean(default=True),
        'message': fields.String(),
        'data': fields.Raw()
    })
    
    error_response = api.model('ErrorResponse', {
        'success': fields.Boolean(default=False),
        'message': fields.String(),
        'error': fields.Raw()
    })
    
    # Lấy thông tin người dùng hiện tại
    @user_ns.route('/me')
    class UserMe(Resource):
        @user_ns.doc(security='jwt')
        @user_ns.marshal_with(user_profile_model)
        @token_required
        def get(current_user_id, self):
            user = users.find_one({'_id': ObjectId(current_user_id)})
            
            if not user:
                user_ns.abort(404, 'User not found')
            
            # Xóa thông tin nhạy cảm
            user.pop('password', None)
            user['_id'] = str(user['_id'])
            
            # Remove profileBio if it exists
            if 'profileBio' in user:
                user.pop('profileBio', None)
            
            return user
        
        def options(self):
            return cors_preflight_response()
    
    # Lấy thông tin người dùng theo ID
    @user_ns.route('/<user_id>')
    class UserById(Resource):
        @user_ns.marshal_with(user_profile_model)
        def get(self, user_id):
            try:
                user = users.find_one({'_id': ObjectId(user_id)})
                
                if not user:
                    user_ns.abort(404, 'User not found')
                
                # Xóa thông tin nhạy cảm
                user.pop('password', None)
                user['_id'] = str(user['_id'])
                
                # Remove profileBio if it exists
                if 'profileBio' in user:
                    user.pop('profileBio', None)
                
                return user
            except Exception as e:
                user_ns.abort(400, f'Invalid user ID: {str(e)}')
            
        def options(self, user_id):
            return cors_preflight_response()
    
    # Cập nhật thông tin người dùng
    @user_ns.route('/update')
    class UpdateUser(Resource):
        @user_ns.doc(security='jwt', 
                    responses={
                        200: 'Success',
                        400: 'Validation Error',
                        401: 'Unauthorized',
                        500: 'Server Error'
                    })
        @user_ns.expect(user_update_model)
        @user_ns.response(200, 'Success', success_response)
        @user_ns.response(400, 'Validation Error', error_response)
        @token_required
        def put(current_user_id, self):
            try:
                data = request.get_json()
                
                # Validate and sanitize input
                validation_errors = {}
                sanitized_data = {}
                
                # Validate fullName
                if 'fullName' in data:
                    if not data['fullName'] or len(data['fullName'].strip()) < 2:
                        validation_errors['fullName'] = 'Full name must be at least 2 characters'
                    elif len(data['fullName']) > 50:
                        validation_errors['fullName'] = 'Full name must be at most 50 characters'
                    else:
                        # Sanitize: Remove HTML tags and normalize spaces
                        sanitized_data['fullName'] = html.escape(data['fullName']).strip()
                
                # Validate dateOfBirth
                if 'dateOfBirth' in data:
                    try:
                        dob = parse(data['dateOfBirth'])
                        # Check if user is at least 13 years old
                        age = relativedelta(datetime.now(), dob).years
                        if age < 13:
                            validation_errors['dateOfBirth'] = 'User must be at least 13 years old'
                        else:
                            # Format to YYYY-MM-DD
                            sanitized_data['dateOfBirth'] = dob.strftime('%Y-%m-%d')
                    except (ValueError, TypeError):
                        validation_errors['dateOfBirth'] = 'Invalid date format, use YYYY-MM-DD'
                
                # Validate profileBio
                if 'profile-bio' in data:
                    if len(data['profile-bio']) > 500:
                        validation_errors['profile-bio'] = 'Bio must be at most 500 characters'
                    else:
                        # Sanitize: Remove HTML tags
                        sanitized_data['profile-bio'] = html.escape(data['profile-bio'])
                
                # Process and validate avatar (base64 image)
                if 'avatar' in data and data['avatar']:
                    try:
                        # Check if it's a valid base64 string
                        avatar_image_id = process_base64_image(data['avatar'], 'avatar', current_user_id)
                        if avatar_image_id:
                            sanitized_data['avatar'] = avatar_image_id
                        else:
                            validation_errors['avatar'] = 'Invalid image format or size exceeds limit'
                    except Exception as e:
                        validation_errors['avatar'] = f'Error processing avatar: {str(e)}'
                
                # Process and validate background (base64 image)
                if 'background' in data and data['background']:
                    try:
                        # Check if it's a valid base64 string
                        background_image_id = process_base64_image(data['background'], 'background', current_user_id)
                        if background_image_id:
                            sanitized_data['background'] = background_image_id
                        else:
                            validation_errors['background'] = 'Invalid image format or size exceeds limit'
                    except Exception as e:
                        validation_errors['background'] = f'Error processing background: {str(e)}'
                
                # Return validation errors if any
                if validation_errors:
                    return {
                        'success': False,
                        'message': 'Validation failed',
                        'error': {
                            'code': 'VALIDATION_ERROR',
                            'details': validation_errors
                        }
                    }, 400
                
                # If no data to update
                if not sanitized_data:
                    return {
                        'success': False,
                        'message': 'No valid fields to update',
                        'error': {
                            'code': 'NO_DATA',
                            'details': 'No valid fields were provided for update'
                        }
                    }, 400
                
                # Add updatedAt timestamp
                sanitized_data['updatedAt'] = datetime.now()
                
                # Update user in database
                result = users.update_one(
                    {'_id': ObjectId(current_user_id)},
                    {'$set': sanitized_data}
                )
                
                if result.modified_count:
                    # Fetch updated user data
                    updated_user = users.find_one({'_id': ObjectId(current_user_id)})
                    
                    # Convert ObjectId to string for JSON serialization
                    if updated_user:
                        updated_user['id'] = str(updated_user.pop('_id'))
                        
                        # Ensure no binary data is being returned
                        # If avatar and background are stored as binary data, convert them to strings
                        if 'avatar' in updated_user and isinstance(updated_user['avatar'], bytes):
                            updated_user['avatar'] = str(updated_user['avatar'])
                        if 'background' in updated_user and isinstance(updated_user['background'], bytes):
                            updated_user['background'] = str(updated_user['background'])
                    
                    return {
                        'success': True,
                        'message': 'Cập nhật thông tin thành công',
                        'data': {
                            'user': updated_user
                        }
                    }, 200
                else:
                    return {
                        'success': True,
                        'message': 'No changes applied',
                        'data': None
                    }, 200
                    
            except Exception as e:
                return {
                    'success': False,
                    'message': 'An error occurred',
                    'error': {
                        'code': 'SERVER_ERROR',
                        'details': str(e)
                    }
                }, 500
            
        def options(self):
            return cors_preflight_response()
    
    # Endpoint để lấy ảnh từ database
    @user_ns.route('/image/<image_id>')
    class GetUserImage(Resource):
        def get(self, image_id):
            try:
                # Tìm file trong GridFS theo ID
                if not ObjectId.is_valid(image_id):
                    return {'error': 'Invalid image ID'}, 400
                
                image = fs.get(ObjectId(image_id))
                if not image:
                    return {'error': 'Image not found'}, 404
                
                # Lấy thông tin content type từ metadata (nếu có)
                content_type = image.metadata.get('contentType', 'image/jpeg')
                
                # Trả về file image với content type phù hợp
                from flask import send_file, make_response
                response = make_response(send_file(
                    io.BytesIO(image.read()),
                    mimetype=content_type
                ))
                response.headers['Content-Type'] = content_type
                return response
                
            except Exception as e:
                return {'error': str(e)}, 500
            
        def options(self, image_id):
            return cors_preflight_response()
    
    # Lấy danh sách người dùng (phân trang)
    @user_ns.route('/list')
    class UserList(Resource):
        @user_ns.doc(params={
            'page': 'Page number (default: 1)',
            'limit': 'Items per page (default: 10)'
        })
        def get(self):
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 10))
            skip = (page - 1) * limit
            
            users_data = list(users.find({}, {'password': 0}).skip(skip).limit(limit))
            total = users.count_documents({})
            
            return {
                'users': users_data,
                'total': total,
                'page': page,
                'limit': limit,
                'pages': (total + limit - 1) // limit
            }
            
        def options(self):
            return cors_preflight_response()
    
    # Tìm kiếm người dùng
    @user_ns.route('/search')
    class SearchUsers(Resource):
        @user_ns.doc(params={
            'query': 'Search query',
            'page': 'Page number (default: 1)',
            'limit': 'Items per page (default: 10)'
        })
        def get(self):
            query = request.args.get('query', '')
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 10))
            skip = (page - 1) * limit
            
            search_filter = {
                '$or': [
                    {'fullName': {'$regex': query, '$options': 'i'}},
                    {'email': {'$regex': query, '$options': 'i'}}
                ]
            }
            
            users_data = list(users.find(search_filter, {'password': 0}).skip(skip).limit(limit))
            total = users.count_documents(search_filter)
            
            return {
                'users': users_data,
                'total': total,
                'page': page,
                'limit': limit,
                'pages': (total + limit - 1) // limit
            }
            
        def options(self):
            return cors_preflight_response()
    
    # Thêm namespace vào API
    api.add_namespace(user_ns) 

# Helper function to validate URLs
def is_valid_url(url):
    url_pattern = re.compile(
        r'^(https?://)?' # http:// or https:// (optional)
        r'([a-zA-Z0-9]+\.)*[a-zA-Z0-9]+\.[a-z]{2,}' # domain
        r'(/[^/\s]*)*$'  # path (optional)
    )
    return bool(url_pattern.match(url))

# Hàm xử lý và lưu ảnh base64 vào GridFS
def process_base64_image(base64_data, image_type, user_id):
    # Xóa các phần header như "data:image/jpeg;base64," nếu có
    if ';base64,' in base64_data:
        base64_data = base64_data.split(';base64,')[1]
    
    try:
        # Decode base64 string
        image_data = base64.b64decode(base64_data)
        
        # Kiểm tra định dạng và kích thước ảnh
        img = Image.open(io.BytesIO(image_data))
        
        # Giới hạn kích thước ảnh (tùy chọn)
        max_size = (1200, 1200)  # Kích thước tối đa
        img.thumbnail(max_size, Image.LANCZOS)
        
        # Chuyển đổi lại thành bytes để lưu vào GridFS
        output = io.BytesIO()
        img_format = img.format if img.format else 'JPEG'
        img.save(output, format=img_format)
        image_bytes = output.getvalue()
        
        # Lưu ảnh vào GridFS với metadata
        filename = f"{image_type}_{user_id}_{datetime.now().timestamp()}"
        content_type = f"image/{img_format.lower()}" if img_format else "image/jpeg"
        
        # Tìm và xóa ảnh cũ nếu có
        user = users.find_one({'_id': ObjectId(user_id)})
        if user and image_type in user and user[image_type]:
            try:
                old_image_id = user[image_type]
                if ObjectId.is_valid(old_image_id):
                    fs.delete(ObjectId(old_image_id))
            except:
                pass  # Bỏ qua lỗi nếu không thể xóa ảnh cũ
        
        # Lưu ảnh mới vào GridFS
        image_id = fs.put(
            image_bytes,
            filename=filename,
            metadata={
                'user_id': user_id,
                'type': image_type,
                'contentType': content_type,
                'uploadDate': datetime.now()
            }
        )
        
        return str(image_id)
    except binascii.Error:
        # Lỗi khi decode base64
        return None
    except Exception as e:
        # Các lỗi khác
        print(f"Error processing image: {str(e)}")
        return None

# Helper function for OPTIONS requests
def cors_preflight_response():
    response = make_response()
    response.status_code = 200
    return response 