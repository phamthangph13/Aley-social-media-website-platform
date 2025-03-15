from flask import request, jsonify, make_response
from flask_restx import Namespace, Resource, fields
from flask_cors import CORS, cross_origin
from bson import ObjectId
from pymongo import MongoClient
from config import Config
import jwt
from functools import wraps
from datetime import datetime
import re
import html
import gridfs
import base64
import binascii
import io
from PIL import Image
import bleach
from pymongo import DESCENDING, ASCENDING

# MongoDB setup
client = MongoClient(Config.MONGO_URI)
db = client.get_database()  # Use the database from MongoDB URI (Aley)
posts = db.posts
users = db.users
friends = db.friends

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

# Helper function for OPTIONS requests
def cors_preflight_response():
    response = make_response()
    response.status_code = 200
    return response

def register_routes(api):
    # Tạo namespace
    post_ns = Namespace('api/posts', description='Post operations')
    
    # Enable CORS directly for the routes that might receive preflight requests
    # We'll handle the OPTIONS requests explicitly for critical endpoints
    
    # Add media endpoint with CORS support
    @post_ns.route('/media/<media_id>')
    class GetPostMedia(Resource):
        @post_ns.doc(responses={
            200: 'Success',
            404: 'Media not found',
            500: 'Server Error'
        })
        @cross_origin()
        def get(self, media_id):
            try:
                # Tìm file trong GridFS theo ID
                if not ObjectId.is_valid(media_id):
                    return {
                        'success': False,
                        'message': 'Invalid media ID format',
                        'error': {
                            'code': 'INVALID_ID',
                            'details': 'The provided ID is not a valid ObjectId'
                        }
                    }, 400
                
                media = fs.get(ObjectId(media_id))
                if not media:
                    return {
                        'success': False,
                        'message': 'Media not found',
                        'error': {
                            'code': 'NOT_FOUND',
                            'details': 'No media exists with the provided ID'
                        }
                    }, 404
                
                # Lấy thông tin content type từ metadata (nếu có)
                content_type = media.metadata.get('contentType', 'image/jpeg')
                
                # Trả về file image với content type phù hợp
                from flask import send_file, make_response
                response = make_response(send_file(
                    io.BytesIO(media.read()),
                    mimetype=content_type
                ))
                response.headers['Content-Type'] = content_type
                # Add CORS headers
                response.headers['Access-Control-Allow-Origin'] = '*'
                response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
                response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept'
                return response
                
            except Exception as e:
                return {
                    'success': False,
                    'message': 'An error occurred',
                    'error': {
                        'code': 'SERVER_ERROR',
                        'details': str(e)
                    }
                }, 500
        
        @cross_origin()
        def options(self, media_id):
            return cors_preflight_response()
    
    # Models
    post_model = api.model('Post', {
        'content': fields.String(description='Post content'),
        'media': fields.List(fields.String(description='Base64 encoded media')),
        'tags': fields.List(fields.String(description='Hashtags')),
        'visibility': fields.String(description='Post visibility', enum=['public', 'friends', 'private']),
        'location': fields.Raw(description='Location information')
    })
    
    comment_model = api.model('Comment', {
        'content': fields.String(required=True, description='Comment text')
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
    
    # Get combined public and friend posts - Fixed endpoint URL and OPTIONS handling
    @post_ns.route('/feed/combined')
    class CombinedFeed(Resource):
        @post_ns.doc(security='jwt',
                    params={
                        'page': 'Page number (default: 1)',
                        'limit': 'Items per page (default: 10)',
                        'sortBy': 'Field to sort by (default: createdAt)',
                        'order': 'Sort order (asc or desc, default: desc)'
                    },
                    responses={
                        200: 'Success',
                        401: 'Unauthorized',
                        500: 'Server Error'
                    })
        @token_required
        @cross_origin()
        def get(self, current_user_id):
            try:
                # Get query parameters
                page = int(request.args.get('page', 1))
                limit = int(request.args.get('limit', 10))
                sort_by = request.args.get('sortBy', 'createdAt')
                order = request.args.get('order', 'desc')
                
                # Validate parameters
                if page < 1:
                    page = 1
                if limit < 1 or limit > 50:
                    limit = 10
                if sort_by not in ['createdAt', 'likes', 'comments', 'shares']:
                    sort_by = 'createdAt'
                sort_order = DESCENDING if order.lower() == 'desc' else ASCENDING
                
                skip = (page - 1) * limit
                
                # Get the user's friend list
                user_friends = []
                friend_records = list(friends.find({
                    '$or': [
                        {'user1Id': current_user_id, 'status': 'accepted'},
                        {'user2Id': current_user_id, 'status': 'accepted'}
                    ]
                }))
                
                for friend in friend_records:
                    if str(friend['user1Id']) == current_user_id:
                        user_friends.append(str(friend['user2Id']))
                    else:
                        user_friends.append(str(friend['user1Id']))
                
                # Build query for posts
                # Get posts that are either:
                # 1. Public posts from anyone
                # 2. Friend-only posts from the user's friends
                # 3. Any posts created by the current user
                posts_query = {
                    '$or': [
                        {'visibility': 'public'},
                        {'userId': current_user_id},
                        {'$and': [
                            {'visibility': 'friends'},
                            {'userId': {'$in': user_friends}}
                        ]}
                    ]
                }
                
                # Execute query with pagination
                posts_data = list(posts.find(posts_query).sort(sort_by, sort_order).skip(skip).limit(limit))
                total_posts = posts.count_documents(posts_query)
                
                # Process posts data
                result_posts = []
                for post in posts_data:
                    # Convert ObjectId to string for JSON serialization
                    post_id = str(post['_id'])
                    post['id'] = post_id
                    del post['_id']
                    
                    # Get user info for the post
                    post_user = users.find_one({'_id': ObjectId(post['userId'])})
                    if post_user:
                        post['user'] = {
                            'id': str(post_user['_id']),
                            'fullName': post_user.get('fullName', ''),
                            'avatar': post_user.get('avatar', '')
                        }
                        
                    # Count comments instead of returning all of them
                    if 'comments' in post:
                        post['commentCount'] = len(post['comments'])
                    else:
                        post['commentCount'] = 0
                        post['comments'] = []
                    
                    result_posts.append(post)
                
                # Return response
                return {
                    'success': True,
                    'data': {
                        'posts': result_posts,
                        'total': total_posts,
                        'page': page,
                        'limit': limit,
                        'pages': (total_posts + limit - 1) // limit
                    }
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
        
        # Handle OPTIONS requests explicitly
        @cross_origin()
        def options(self):
            return {'success': True}, 200, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
            }
    
    # Create a new post endpoint
    @post_ns.route('/')
    class CreatePost(Resource):
        @post_ns.doc(security='jwt',
                    responses={
                        201: 'Post created successfully',
                        400: 'Validation Error',
                        401: 'Unauthorized',
                        500: 'Server Error'
                    })
        @post_ns.expect(post_model)
        @post_ns.response(201, 'Success', success_response)
        @post_ns.response(400, 'Validation Error', error_response)
        @token_required
        @cross_origin()
        def post(current_user_id, self):
            try:
                data = request.get_json()
                
                # Validate and sanitize input
                validation_errors = {}
                sanitized_data = {}
                
                # Validate content
                if 'content' not in data or not data['content'].strip():
                    validation_errors['content'] = 'Content is required'
                elif len(data['content']) > 5000:
                    validation_errors['content'] = 'Content must be at most 5000 characters'
                else:
                    # Sanitize: escape HTML tags
                    sanitized_data['content'] = sanitize_html(data['content'])
                    
                    # Extract hashtags from content
                    tags_from_content = extract_hashtags(data['content'])
                    if tags_from_content:
                        sanitized_data['tags'] = tags_from_content
                
                # Validate tags (if provided separately)
                if 'tags' in data and data['tags']:
                    # Merge with tags extracted from content and remove duplicates
                    all_tags = list(set(sanitized_data.get('tags', []) + data['tags']))
                    sanitized_data['tags'] = [tag.lower() for tag in all_tags if tag.strip()]
                
                # Validate visibility
                if 'visibility' not in data:
                    sanitized_data['visibility'] = 'public'  # Default
                elif data['visibility'] not in ['public', 'friends', 'private']:
                    validation_errors['visibility'] = 'Visibility must be one of: public, friends, private'
                else:
                    sanitized_data['visibility'] = data['visibility']
                
                # Validate location (if provided)
                if 'location' in data and data['location']:
                    sanitized_location = {}
                    
                    if 'name' in data['location'] and data['location']['name']:
                        sanitized_location['name'] = html.escape(data['location']['name'])
                    
                    if 'coordinates' in data['location'] and data['location']['coordinates']:
                        coords = data['location']['coordinates']
                        if 'latitude' in coords and 'longitude' in coords:
                            try:
                                lat = float(coords['latitude'])
                                lng = float(coords['longitude'])
                                if -90 <= lat <= 90 and -180 <= lng <= 180:
                                    sanitized_location['coordinates'] = {
                                        'latitude': lat,
                                        'longitude': lng
                                    }
                                else:
                                    validation_errors['location.coordinates'] = 'Invalid coordinates range'
                            except (ValueError, TypeError):
                                validation_errors['location.coordinates'] = 'Coordinates must be valid numbers'
                    
                    if sanitized_location:
                        sanitized_data['location'] = sanitized_location
                
                # Process media (base64 images or videos)
                if 'media' in data and data['media']:
                    sanitized_data['mediaIds'] = []
                    
                    # Generate temporary post ID (will be replaced after insertion)
                    temp_post_id = str(ObjectId())
                    
                    for index, media_item in enumerate(data['media']):
                        if not media_item:
                            continue
                            
                        try:
                            media_id = process_base64_image(media_item, temp_post_id, current_user_id)
                            if media_id:
                                sanitized_data['mediaIds'].append(media_id)
                            else:
                                validation_errors[f'media[{index}]'] = 'Invalid media format'
                        except Exception as e:
                            validation_errors[f'media[{index}]'] = f'Error processing media: {str(e)}'
                
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
                
                # Add required fields
                sanitized_data['userId'] = current_user_id
                sanitized_data['createdAt'] = datetime.now()
                sanitized_data['updatedAt'] = datetime.now()
                sanitized_data['likes'] = []
                sanitized_data['comments'] = []
                sanitized_data['shares'] = 0
                
                # Insert post into database
                post_id = posts.insert_one(sanitized_data).inserted_id
                
                # Update post IDs in GridFS media files if there are any
                if 'mediaIds' in sanitized_data and sanitized_data['mediaIds']:
                    for media_id in sanitized_data['mediaIds']:
                        if ObjectId.is_valid(media_id):
                            fs.update_one(
                                {"_id": ObjectId(media_id)},
                                {"$set": {"metadata.post_id": str(post_id)}}
                            )
                
                # Get the inserted post
                post = posts.find_one({'_id': post_id})
                post['id'] = str(post.pop('_id'))
                
                return {
                    'success': True,
                    'message': 'Post created successfully',
                    'data': {
                        'post': post
                    }
                }, 201
                
            except Exception as e:
                return {
                    'success': False,
                    'message': 'An error occurred',
                    'error': {
                        'code': 'SERVER_ERROR',
                        'details': str(e)
                    }
                }, 500
    
    # Example endpoint for getting a post by ID
    @post_ns.route('/<post_id>')
    class PostById(Resource):
        @post_ns.doc(responses={
            200: 'Success',
            404: 'Post not found',
            500: 'Server Error'
        })
        @cross_origin()
        def get(self, post_id):
            try:
                if not ObjectId.is_valid(post_id):
                    return {
                        'success': False,
                        'message': 'Invalid post ID format',
                        'error': {
                            'code': 'INVALID_ID',
                            'details': 'The provided ID is not a valid ObjectId'
                        }
                    }, 400
                    
                post = posts.find_one({'_id': ObjectId(post_id)})
                
                if not post:
                    return {
                        'success': False,
                        'message': 'Post not found',
                        'error': {
                            'code': 'NOT_FOUND',
                            'details': 'No post exists with the provided ID'
                        }
                    }, 404
                
                # Check post visibility
                if post['visibility'] != 'public':
                    # For non-public posts, require auth
                    auth_header = request.headers.get('Authorization')
                    if not auth_header:
                        return {
                            'success': False,
                            'message': 'Authentication required to view this post',
                            'error': {
                                'code': 'AUTH_REQUIRED',
                                'details': 'This post requires authentication to view'
                            }
                        }, 401
                    
                    # Verify token and get user ID
                    token = auth_header.split(' ')[1] if ' ' in auth_header else auth_header
                    try:
                        payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
                        current_user_id = payload['user_id']
                        
                        # Check if user can access this post
                        if post['visibility'] == 'private' and post['userId'] != current_user_id:
                            return {
                                'success': False,
                                'message': 'You do not have permission to view this post',
                                'error': {
                                    'code': 'FORBIDDEN',
                                    'details': 'This post is private'
                                }
                            }, 403
                            
                        if post['visibility'] == 'friends':
                            # Check if user is friends with post creator
                            is_friend = friends.find_one({
                                '$or': [
                                    {'user1Id': current_user_id, 'user2Id': post['userId'], 'status': 'accepted'},
                                    {'user1Id': post['userId'], 'user2Id': current_user_id, 'status': 'accepted'}
                                ]
                            })
                            
                            if not is_friend and post['userId'] != current_user_id:
                                return {
                                    'success': False,
                                    'message': 'You do not have permission to view this post',
                                    'error': {
                                        'code': 'FORBIDDEN',
                                        'details': 'This post is only visible to friends'
                                    }
                                }, 403
                    except:
                        return {
                            'success': False,
                            'message': 'Invalid or expired token',
                            'error': {
                                'code': 'INVALID_TOKEN',
                                'details': 'Please provide a valid authentication token'
                            }
                        }, 401
                
                # Convert ObjectId to string for JSON serialization
                post['id'] = str(post.pop('_id'))
                
                # Get user info
                user_info = users.find_one({'_id': ObjectId(post['userId'])})
                if user_info:
                    post['user'] = {
                        'id': str(user_info['_id']),
                        'fullName': user_info.get('fullName', ''),
                        'avatar': user_info.get('avatar', '')
                    }
                
                return {
                    'success': True,
                    'data': {
                        'post': post
                    }
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
        
        @cross_origin()
        def options(self, post_id):
            return cors_preflight_response()
    
    # Thêm namespace vào API
    api.add_namespace(post_ns)

# Helper function to sanitize HTML content
def sanitize_html(content):
    allowed_tags = ['b', 'i', 'u', 'p', 'br', 'ul', 'ol', 'li', 'strong', 'em']
    allowed_attrs = {'*': ['class']}
    return bleach.clean(content, tags=allowed_tags, attributes=allowed_attrs, strip=True)

# Helper function to extract hashtags from content
def extract_hashtags(content):
    hashtag_pattern = r'#(\w+)'
    return re.findall(hashtag_pattern, content)

# Hàm xử lý và lưu ảnh base64 vào GridFS
def process_base64_image(base64_data, post_id, user_id):
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
        filename = f"post_{post_id}_{datetime.now().timestamp()}"
        content_type = f"image/{img_format.lower()}" if img_format else "image/jpeg"
        
        # Lưu ảnh mới vào GridFS
        image_id = fs.put(
            image_bytes,
            filename=filename,
            metadata={
                'user_id': user_id,
                'post_id': post_id,
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