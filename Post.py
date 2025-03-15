from flask import request, jsonify, Response, make_response
from flask_restx import Namespace, Resource, fields
from bson import ObjectId
from pymongo import MongoClient, DESCENDING
from config import Config
import jwt
from functools import wraps
from datetime import datetime
import os
import uuid
from werkzeug.utils import secure_filename
import io
import base64
import gridfs
import mimetypes

# MongoDB setup
client = MongoClient(Config.MONGO_URI)
db = client.get_database()  # Use the database from MongoDB URI (Aley)
posts = db.posts
users = db.users
fs = gridfs.GridFS(db)  # Use GridFS for file storage

# JWT decorator to protect routes
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            # Extract token from header "Bearer <token>"
            if ' ' in auth_header:
                token = auth_header.split(' ')[1]
            else:
                token = auth_header
        
        if not token:
            return {'message': 'Token is missing'}, 401
        
        try:
            # Decode token
            payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
            current_user_id = payload['user_id']
        except jwt.ExpiredSignatureError:
            return {'message': 'Token has expired'}, 401
        except jwt.InvalidTokenError:
            return {'message': 'Invalid token'}, 401
        
        return f(current_user_id, *args, **kwargs)
    
    return decorated

# Function to handle file uploads
def save_file(file, folder='uploads'):
    # Create directory if it doesn't exist
    upload_dir = os.path.join('static', folder)
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
    
    # Generate a unique filename
    filename = secure_filename(file.filename)
    unique_filename = f"{uuid.uuid4()}_{filename}"
    
    # Save the file
    file_path = os.path.join(upload_dir, unique_filename)
    file.save(file_path)
    
    # Return relative path from static folder
    return os.path.join(folder, unique_filename)

# Function to add media URLs to posts
def add_media_urls_to_post(post, base_url=None):
    """Add media URLs to post media items.
    
    Args:
        post: The post document with media items
        base_url: Base URL for API (defaults to Config.API_BASE_URL if not provided)
    
    Returns:
        Post with enriched media containing URLs
    """
    if not post or 'media' not in post or not post['media']:
        return post
    
    # Use provided base_url or get from config
    if not base_url:
        base_url = getattr(Config, 'API_BASE_URL', '')
    
    # Make sure base_url doesn't end with slash
    if base_url and base_url.endswith('/'):
        base_url = base_url[:-1]
    
    # Add URL to each media item
    for media_item in post['media']:
        if 'id' in media_item:
            media_id = media_item['id']
            media_item['url'] = f"{base_url}/api/media/{media_id}"
    
    return post

# Helper function for OPTIONS requests
def cors_preflight_response():
    response = make_response()
    response.status_code = 200
    return response

def register_routes(api):
    # Create namespace
    post_ns = Namespace('api/posts', description='Post operations')
    
    # Models
    emotion_model = api.model('Emotion', {
        'emoji': fields.String(description='Emotion emoji'),
        'name': fields.String(description='Emotion name')
    })
    
    media_model = api.model('Media', {
        'id': fields.String(description='Media ID'),
        'type': fields.String(description='Media type (image/video)'),
        'filename': fields.String(description='Original filename')
    })
    
    post_model = api.model('Post', {
        'post_id': fields.String(description='Post ID'),
        'created_at': fields.DateTime(description='Creation timestamp'),
        'updated_at': fields.DateTime(description='Last update timestamp'),
        'author': fields.Raw(description='Author information'),
        'content': fields.String(description='Post content'),
        'media': fields.List(fields.Nested(media_model), description='Media attachments'),
        'emotion': fields.Nested(emotion_model, description='User emotion'),
        'location': fields.String(description='Location'),
        'likes_count': fields.Integer(description='Number of likes'),
        'comments_count': fields.Integer(description='Number of comments'),
        'shares_count': fields.Integer(description='Number of shares'),
        'privacy': fields.String(description='Privacy setting (public, friends, private)')
    })
    
    create_post_model = api.model('CreatePost', {
        'content': fields.String(description='Post content'),
        'emotion': fields.Nested(emotion_model, description='User emotion'),
        'location': fields.String(description='Location'),
        'privacy': fields.String(description='Privacy setting (public, friends, private)')
    })
    
    # Create a new post
    @post_ns.route('')
    class PostResource(Resource):
        @post_ns.doc(security='jwt')
        @post_ns.expect(create_post_model)
        @token_required
        def post(current_user_id, self):
            try:
                # Get user data
                user = users.find_one({'_id': ObjectId(current_user_id)})
                if not user:
                    return {'success': False, 'message': 'User not found'}, 404
                
                # Process form data and files
                content = request.form.get('content', '')
                emotion_data = request.form.get('emotion')
                location = request.form.get('location', '')
                privacy = request.form.get('privacy', 'public')
                
                # Validate data
                if not content and 'attachments[]' not in request.files:
                    return {
                        'success': False, 
                        'message': 'Vui lòng nhập nội dung hoặc thêm hình ảnh/video',
                        'error_code': 'EMPTY_POST'
                    }, 400
                
                # Process emotion data
                emotion = None
                if emotion_data:
                    try:
                        # Try parsing JSON string
                        if isinstance(emotion_data, str):
                            import json
                            emotion = json.loads(emotion_data)
                        else:
                            emotion = emotion_data
                    except:
                        emotion = None
                
                # Process media files
                media = []
                if 'attachments[]' in request.files:
                    files = request.files.getlist('attachments[]')
                    
                    # Check number of files
                    if len(files) > 10:
                        return {
                            'success': False,
                            'message': 'Không thể đăng tải quá 10 tệp đính kèm',
                            'error_code': 'TOO_MANY_FILES'
                        }, 400
                    
                    for file in files:
                        # Check file size
                        file.seek(0, os.SEEK_END)
                        file_size = file.tell()
                        file.seek(0)
                        
                        # Validate file size
                        if 'image' in file.content_type and file_size > 10 * 1024 * 1024:  # 10MB
                            return {
                                'success': False,
                                'message': f'Kích thước ảnh vượt quá giới hạn cho phép (10MB): {file.filename}',
                                'error_code': 'FILE_TOO_LARGE'
                            }, 413
                        elif 'video' in file.content_type and file_size > 100 * 1024 * 1024:  # 100MB
                            return {
                                'success': False,
                                'message': f'Kích thước video vượt quá giới hạn cho phép (100MB): {file.filename}',
                                'error_code': 'FILE_TOO_LARGE'
                            }, 413
                        
                        # Validate file type
                        supported_image_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
                        supported_video_types = ['video/mp4', 'video/webm', 'video/quicktime']
                        
                        if file.content_type not in supported_image_types + supported_video_types:
                            return {
                                'success': False,
                                'message': f'Định dạng tệp không được hỗ trợ: {file.filename}',
                                'error_code': 'UNSUPPORTED_FILE_TYPE'
                            }, 415
                        
                        # Determine media type and save
                        media_type = 'image' if file.content_type in supported_image_types else 'video'
                        file_id = str(uuid.uuid4())
                        grid_id = fs.put(
                            file.read(),
                            filename=file.filename,
                            content_type=file.content_type,
                            file_id=file_id
                        )
                        
                        media.append({
                            'id': str(grid_id),
                            'type': media_type,
                            'filename': file.filename
                        })
                
                # Create post document
                now = datetime.utcnow()
                post = {
                    'author_id': ObjectId(current_user_id),
                    'content': content,
                    'media': media,
                    'emotion': emotion,
                    'location': location,
                    'created_at': now,
                    'updated_at': now,
                    'likes_count': 0,
                    'comments_count': 0,
                    'shares_count': 0,
                    'privacy': privacy,
                    'likes': [],
                    'comments': []
                }
                
                # Insert post
                result = posts.insert_one(post)
                post_id = result.inserted_id
                
                # Prepare author info for response
                author_info = {
                    'id': str(user['_id']),
                    'name': user.get('fullName', ''),
                    'avatar': user.get('avatar', '')
                }
                
                # Prepare response
                response_data = {
                    'post_id': str(post_id),
                    'created_at': now.isoformat(),
                    'author': author_info,
                    'content': content,
                    'media': media,
                    'emotion': emotion,
                    'location': location,
                    'likes_count': 0,
                    'comments_count': 0,
                    'shares_count': 0,
                    'privacy': privacy
                }
                
                return {
                    'success': True,
                    'message': 'Bài viết đã được đăng thành công',
                    'data': response_data
                }, 200
                
            except Exception as e:
                print(f"Lỗi khi đăng bài: {str(e)}")
                return {
                    'success': False,
                    'message': 'Đã xảy ra lỗi khi đăng bài viết',
                    'error_code': 'SERVER_ERROR'
                }, 500
            
        def options(self):
            return cors_preflight_response()
    
    # Get all posts (with pagination)
    @post_ns.route('/list')
    class PostList(Resource):
        @post_ns.doc(params={
            'page': 'Page number (default: 1)',
            'limit': 'Items per page (default: 10)'
        })
        def get(self):
            try:
                page = int(request.args.get('page', 1))
                limit = int(request.args.get('limit', 10))
                skip = (page - 1) * limit
                
                # Get base URL for media
                base_url = request.url_root.rstrip('/')
                
                # Get posts with pagination (newest first)
                posts_data = list(posts.find({'privacy': 'public'}).sort('created_at', DESCENDING).skip(skip).limit(limit))
                total = posts.count_documents({'privacy': 'public'})
                
                # Enrich posts with author information
                enriched_posts = []
                for post in posts_data:
                    # Convert ObjectId to string
                    post['_id'] = str(post['_id'])
                    
                    # Get author info
                    author = users.find_one({'_id': post['author_id']})
                    if author:
                        post['author'] = {
                            'id': str(author['_id']),
                            'name': author.get('fullName', ''),
                            'avatar': author.get('avatar', '')
                        }
                        
                    # Remove author_id (replaced by author object)
                    post.pop('author_id', None)
                    
                    # Add media URLs
                    post = add_media_urls_to_post(post, base_url)
                    
                    enriched_posts.append(post)
                
                return {
                    'posts': enriched_posts,
                    'total': total,
                    'page': page,
                    'limit': limit,
                    'pages': (total + limit - 1) // limit
                }
            
            except Exception as e:
                return {'success': False, 'message': f'Lỗi: {str(e)}'}, 400
            
        def options(self):
            return cors_preflight_response()
    
    # Get a specific post
    @post_ns.route('/<post_id>')
    class PostDetail(Resource):
        def get(self, post_id):
            try:
                post = posts.find_one({'_id': ObjectId(post_id)})
                
                if not post:
                    return {'success': False, 'message': 'Bài viết không tồn tại'}, 404
                
                # Convert ObjectId to string
                post['_id'] = str(post['_id'])
                
                # Get author info
                author = users.find_one({'_id': post['author_id']})
                if author:
                    post['author'] = {
                        'id': str(author['_id']),
                        'name': author.get('fullName', ''),
                        'avatar': author.get('avatar', '')
                    }
                
                # Remove author_id (replaced by author object)
                post.pop('author_id', None)
                
                # Add media URLs
                base_url = request.url_root.rstrip('/')
                post = add_media_urls_to_post(post, base_url)
                
                return {'success': True, 'data': post}
            except Exception as e:
                return {'success': False, 'message': f'Lỗi: {str(e)}'}, 400
            
        def options(self, post_id):
            return cors_preflight_response()
    
    # Update a post
    @post_ns.route('/<post_id>')
    class UpdatePost(Resource):
        @post_ns.doc(security='jwt')
        @token_required
        def put(current_user_id, self, post_id):
            try:
                # Get the post
                post = posts.find_one({'_id': ObjectId(post_id)})
                
                if not post:
                    return {'success': False, 'message': 'Bài viết không tồn tại'}, 404
                
                # Check ownership
                if str(post['author_id']) != current_user_id:
                    return {'success': False, 'message': 'Bạn không có quyền chỉnh sửa bài viết này'}, 403
                
                # Get update data
                data = request.json
                
                # Only allow certain fields to be updated
                allowed_fields = ['content', 'emotion', 'location', 'privacy']
                update_data = {k: v for k, v in data.items() if k in allowed_fields}
                
                if not update_data:
                    return {'success': False, 'message': 'Không có dữ liệu để cập nhật'}, 400
                
                # Add updated timestamp
                update_data['updated_at'] = datetime.utcnow()
                
                # Update post
                result = posts.update_one(
                    {'_id': ObjectId(post_id)},
                    {'$set': update_data}
                )
                
                if result.modified_count:
                    return {'success': True, 'message': 'Bài viết đã được cập nhật'}, 200
                else:
                    return {'success': True, 'message': 'Không có thay đổi nào được áp dụng'}, 200
                
            except Exception as e:
                return {'success': False, 'message': f'Lỗi: {str(e)}'}, 400
            
        def options(self, post_id):
            return cors_preflight_response()
    
    # Delete a post
    @post_ns.route('/<post_id>')
    class DeletePost(Resource):
        @post_ns.doc(security='jwt')
        @token_required
        def delete(current_user_id, self, post_id):
            try:
                # Get the post
                post = posts.find_one({'_id': ObjectId(post_id)})
                
                if not post:
                    return {'success': False, 'message': 'Bài viết không tồn tại'}, 404
                
                # Check ownership
                if str(post['author_id']) != current_user_id:
                    return {'success': False, 'message': 'Bạn không có quyền xóa bài viết này'}, 403
                
                # Delete the post
                result = posts.delete_one({'_id': ObjectId(post_id)})
                
                if result.deleted_count:
                    # TODO: Delete associated media files
                    
                    return {'success': True, 'message': 'Bài viết đã được xóa'}, 200
                else:
                    return {'success': False, 'message': 'Không thể xóa bài viết'}, 400
                
            except Exception as e:
                return {'success': False, 'message': f'Lỗi: {str(e)}'}, 400
            
        def options(self, post_id):
            return cors_preflight_response()
    
    # Like/unlike a post
    @post_ns.route('/<post_id>/like')
    class LikePost(Resource):
        @post_ns.doc(security='jwt')
        @token_required
        def post(current_user_id, self, post_id):
            try:
                # Get the post
                post = posts.find_one({'_id': ObjectId(post_id)})
                
                if not post:
                    return {'success': False, 'message': 'Bài viết không tồn tại'}, 404
                
                # Check if user already liked the post
                user_id_obj = ObjectId(current_user_id)
                likes = post.get('likes', [])
                
                if user_id_obj in likes:
                    # Unlike the post
                    result = posts.update_one(
                        {'_id': ObjectId(post_id)},
                        {
                            '$pull': {'likes': user_id_obj},
                            '$inc': {'likes_count': -1}
                        }
                    )
                    
                    if result.modified_count:
                        return {'success': True, 'message': 'Đã bỏ thích bài viết', 'liked': False}, 200
                    else:
                        return {'success': False, 'message': 'Không thể bỏ thích bài viết'}, 400
                else:
                    # Like the post
                    result = posts.update_one(
                        {'_id': ObjectId(post_id)},
                        {
                            '$addToSet': {'likes': user_id_obj},
                            '$inc': {'likes_count': 1}
                        }
                    )
                    
                    if result.modified_count:
                        return {'success': True, 'message': 'Đã thích bài viết', 'liked': True}, 200
                    else:
                        return {'success': False, 'message': 'Không thể thích bài viết'}, 400
                
            except Exception as e:
                return {'success': False, 'message': f'Lỗi: {str(e)}'}, 400
            
        def options(self, post_id):
            return cors_preflight_response()
    
    # Get user's news feed (posts from all users - public posts)
    @post_ns.route('/feed')
    class NewsFeed(Resource):
        @post_ns.doc(security='jwt', params={
            'page': 'Page number (default: 1)',
            'limit': 'Items per page (default: 10)'
        })
        @token_required
        def get(current_user_id, self):
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 10))
            skip = (page - 1) * limit
            
            # Get base URL for media
            base_url = request.url_root.rstrip('/')
            
            # Get public posts (newest first)
            posts_data = list(posts.find({'privacy': 'public'}).sort('created_at', DESCENDING).skip(skip).limit(limit))
            total = posts.count_documents({'privacy': 'public'})
            
            # Enrich posts with author information and like status
            enriched_posts = []
            for post in posts_data:
                # Convert ObjectId to string
                post['_id'] = str(post['_id'])
                
                # Get author info
                author = users.find_one({'_id': post['author_id']})
                if author:
                    post['author'] = {
                        'id': str(author['_id']),
                        'name': author.get('fullName', ''),
                        'avatar': author.get('avatar', '')
                    }
                
                # Check if current user liked the post
                post['liked_by_me'] = ObjectId(current_user_id) in post.get('likes', [])
                
                # Remove likes array, keep only the count
                post.pop('likes', None)
                
                # Remove author_id (replaced by author object)
                post.pop('author_id', None)
                
                # Add media URLs
                post = add_media_urls_to_post(post, base_url)
                
                enriched_posts.append(post)
            
            return {
                'success': True,
                'data': {
                    'posts': enriched_posts,
                    'total': total,
                    'page': page,
                    'limit': limit,
                    'pages': (total + limit - 1) // limit
                }
            }
            
        def options(self):
            return cors_preflight_response()
    
    # Get posts from a specific user
    @post_ns.route('/user/<user_id>')
    class UserPosts(Resource):
        @post_ns.doc(params={
            'page': 'Page number (default: 1)',
            'limit': 'Items per page (default: 10)'
        })
        def get(self, user_id):
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 10))
            skip = (page - 1) * limit
            
            try:
                # Get base URL for media
                base_url = request.url_root.rstrip('/')
                
                # Validate user exists
                user = users.find_one({'_id': ObjectId(user_id)})
                if not user:
                    return {'success': False, 'message': 'Người dùng không tồn tại'}, 404
                
                # Get user's public posts
                posts_data = list(posts.find({
                    'author_id': ObjectId(user_id),
                    'privacy': 'public'
                }).sort('created_at', DESCENDING).skip(skip).limit(limit))
                
                total = posts.count_documents({
                    'author_id': ObjectId(user_id),
                    'privacy': 'public'
                })
                
                # Enrich posts
                enriched_posts = []
                for post in posts_data:
                    # Convert ObjectId to string
                    post['_id'] = str(post['_id'])
                    
                    # Add author info
                    post['author'] = {
                        'id': str(user['_id']),
                        'name': user.get('fullName', ''),
                        'avatar': user.get('avatar', '')
                    }
                    
                    # Remove author_id (replaced by author object)
                    post.pop('author_id', None)
                    
                    # Remove likes array, keep only the count
                    post.pop('likes', None)
                    
                    # Add media URLs
                    post = add_media_urls_to_post(post, base_url)
                    
                    enriched_posts.append(post)
                
                return {
                    'success': True,
                    'data': {
                        'posts': enriched_posts,
                        'total': total,
                        'page': page,
                        'limit': limit,
                        'pages': (total + limit - 1) // limit
                    }
                }
                
            except Exception as e:
                return {'success': False, 'message': f'Lỗi: {str(e)}'}, 400
            
        def options(self, user_id):
            return cors_preflight_response()
    
    # Add namespace to API
    api.add_namespace(post_ns)

    # Create a Media namespace for retrieving media files
    media_ns = Namespace('api/media', description='Media file operations')

    # Get media file by ID
    @media_ns.route('/<media_id>')
    class MediaResource(Resource):
        def get(self, media_id):
            try:
                # Try to find the file in GridFS
                file = None
                try:
                    file = fs.get(ObjectId(media_id))
                except:
                    # If not found by _id, try by file_id
                    files = db.fs.files.find_one({'file_id': media_id})
                    if files:
                        file = fs.get(files['_id'])
                
                if not file:
                    return {'success': False, 'message': 'File not found'}, 404
                
                # Get content type
                content_type = file.content_type
                
                # Create response with the file
                response = file.read()
                
                # Return file content with appropriate content type
                return Response(
                    response=response,
                    status=200,
                    mimetype=content_type,
                    headers={
                        'Content-Disposition': f'inline; filename={file.filename}'
                    }
                )
                
            except Exception as e:
                return {'success': False, 'message': f'Error retrieving file: {str(e)}'}, 500
            
        def options(self, media_id):
            return cors_preflight_response()
    
    # Add media namespace to API
    api.add_namespace(media_ns) 