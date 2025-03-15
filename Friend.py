from flask import request, jsonify, make_response
from flask_restx import Namespace, Resource, fields
from bson import ObjectId
from pymongo import MongoClient
from config import Config
import jwt
from functools import wraps
from datetime import datetime

# MongoDB setup
client = MongoClient(Config.MONGO_URI)
db = client.get_database()  # Use the database from MongoDB URI (Aley)
users = db.users
friends = db.friends
friend_requests = db.friend_requests

# JWT decorator to protect routes
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            # Get token from "Bearer <token>" header
            if ' ' in auth_header:
                token = auth_header.split(' ')[1]
            else:
                token = auth_header
        
        if not token:
            return {'success': False, 'error': {'code': 'UNAUTHORIZED', 'message': 'Bạn cần đăng nhập để sử dụng tính năng này'}}, 401
        
        try:
            # Decode token
            payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
            current_user_id = payload['user_id']
        except jwt.ExpiredSignatureError:
            return {'success': False, 'error': {'code': 'UNAUTHORIZED', 'message': 'Token đã hết hạn'}}, 401
        except jwt.InvalidTokenError:
            return {'success': False, 'error': {'code': 'UNAUTHORIZED', 'message': 'Token không hợp lệ'}}, 401
        
        return f(current_user_id, *args, **kwargs)
    
    return decorated

# Helper function for OPTIONS requests
def cors_preflight_response():
    response = make_response()
    response.status_code = 200
    return response

def register_routes(api):
    # Create namespace
    friend_ns = Namespace('api/friends', description='Friend operations')
    
    # Models
    user_profile_model = api.model('UserProfileSimple', {
        'user_id': fields.String(description='User ID'),
        'name': fields.String(description='User name'),
        'avatar': fields.String(description='User avatar URL'),
        'bio': fields.String(description='User bio', required=False),
        'mutual_friends_count': fields.Integer(description='Count of mutual friends', required=False)
    })
    
    friend_request_model = api.model('FriendRequest', {
        'recipient_id': fields.String(description='ID of the user to send request to', required=True)
    })
    
    # Response models
    pagination_model = api.model('Pagination', {
        'current_page': fields.Integer(),
        'total_pages': fields.Integer(),
        'total_items': fields.Integer(),
        'limit': fields.Integer()
    })
    
    suggestion_response_model = api.model('SuggestionResponse', {
        'success': fields.Boolean(default=True),
        'data': fields.Nested(api.model('SuggestionData', {
            'suggestions': fields.List(fields.Nested(user_profile_model)),
            'pagination': fields.Nested(pagination_model)
        }))
    })
    
    friend_request_response_model = api.model('FriendRequestResponse', {
        'success': fields.Boolean(default=True),
        'data': fields.Nested(api.model('FriendRequestData', {
            'request_id': fields.String(),
            'recipient': fields.Nested(user_profile_model),
            'status': fields.String(),
            'created_at': fields.DateTime()
        }))
    })
    
    friend_request_delete_response = api.model('RequestDeleteResponse', {
        'success': fields.Boolean(default=True),
        'data': fields.Nested(api.model('DeleteData', {
            'message': fields.String()
        }))
    })
    
    friendship_response_model = api.model('FriendshipResponse', {
        'success': fields.Boolean(default=True),
        'data': fields.Nested(api.model('FriendshipData', {
            'friendship_id': fields.String(),
            'friend': fields.Nested(user_profile_model),
            'created_at': fields.DateTime()
        }))
    })
    
    friend_status_model = api.model('FriendStatusResponse', {
        'success': fields.Boolean(default=True),
        'data': fields.Nested(api.model('StatusData', {
            'status': fields.String(description='Friendship status: friends, pending_sent, pending_received, or not_friends'),
            'user_id': fields.String(description='Target user ID'),
            'request_id': fields.String(description='Friend request ID if applicable', required=False),
            'friendship_id': fields.String(description='Friendship ID if applicable', required=False)
        }))
    })
    
    received_requests_model = api.model('ReceivedRequestsResponse', {
        'success': fields.Boolean(default=True),
        'data': fields.Nested(api.model('ReceivedData', {
            'requests': fields.List(fields.Nested(api.model('ReceivedRequest', {
                'request_id': fields.String(),
                'sender': fields.Nested(user_profile_model),
                'created_at': fields.DateTime()
            }))),
            'pagination': fields.Nested(pagination_model)
        }))
    })
    
    sent_requests_model = api.model('SentRequestsResponse', {
        'success': fields.Boolean(default=True),
        'data': fields.Nested(api.model('SentData', {
            'requests': fields.List(fields.Nested(api.model('SentRequest', {
                'request_id': fields.String(),
                'recipient': fields.Nested(user_profile_model),
                'created_at': fields.DateTime()
            }))),
            'pagination': fields.Nested(pagination_model)
        }))
    })
    
    error_response = api.model('ErrorResponse', {
        'success': fields.Boolean(default=False),
        'error': fields.Nested(api.model('ErrorDetail', {
            'code': fields.String(),
            'message': fields.String()
        }))
    })
    
    # Helper function to get user profile data
    def get_user_profile(user_id, include_mutual=False, current_user_id=None):
        user = users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return None
            
        profile = {
            'user_id': str(user['_id']),
            'name': user.get('fullName', ''),
            'avatar': user.get('avatar', '')
        }
        
        # Add bio if available
        if 'profile-bio' in user:
            profile['bio'] = user.get('profile-bio', '')
        
        # Add mutual friends count if requested
        if include_mutual and current_user_id:
            # Get current user's friends
            current_user_friends = friends.find(
                {'$or': [
                    {'user_id': current_user_id, 'status': 'accepted'},
                    {'friend_id': current_user_id, 'status': 'accepted'}
                ]},
                {'user_id': 1, 'friend_id': 1}
            )
            
            # Get target user's friends
            target_user_friends = friends.find(
                {'$or': [
                    {'user_id': user_id, 'status': 'accepted'},
                    {'friend_id': user_id, 'status': 'accepted'}
                ]},
                {'user_id': 1, 'friend_id': 1}
            )
            
            # Calculate mutual friends
            current_user_friend_ids = set()
            for friendship in current_user_friends:
                if str(friendship['user_id']) == current_user_id:
                    current_user_friend_ids.add(str(friendship['friend_id']))
                else:
                    current_user_friend_ids.add(str(friendship['user_id']))
            
            target_user_friend_ids = set()
            for friendship in target_user_friends:
                if str(friendship['user_id']) == user_id:
                    target_user_friend_ids.add(str(friendship['friend_id']))
                else:
                    target_user_friend_ids.add(str(friendship['user_id']))
            
            mutual_friends = current_user_friend_ids.intersection(target_user_friend_ids)
            profile['mutual_friends_count'] = len(mutual_friends)
        
        return profile
    
    # Helper function to check if users are friends
    def are_friends(user_id, friend_id):
        friendship = friends.find_one({
            '$or': [
                {'user_id': user_id, 'friend_id': friend_id, 'status': 'accepted'},
                {'user_id': friend_id, 'friend_id': user_id, 'status': 'accepted'}
            ]
        })
        return friendship is not None
    
    # Helper function to check for pending friend requests
    def has_pending_request(sender_id, recipient_id):
        request = friend_requests.find_one({
            'sender_id': sender_id,
            'recipient_id': recipient_id,
            'status': 'pending'
        })
        return request is not None
    
    # 1. Get Friend Suggestions Endpoint
    @friend_ns.route('/suggestions')
    class FriendSuggestions(Resource):
        @friend_ns.doc(security='jwt')
        @friend_ns.response(200, 'Success', suggestion_response_model)
        @friend_ns.response(401, 'Unauthorized', error_response)
        @token_required
        def get(current_user_id, self):
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 20))
            search = request.args.get('search', '')
            
            skip = (page - 1) * limit
            
            # Get all the user's friend IDs
            user_friends = friends.find(
                {'$or': [
                    {'user_id': current_user_id, 'status': 'accepted'},
                    {'friend_id': current_user_id, 'status': 'accepted'}
                ]}
            )
            
            friend_ids = []
            for friendship in user_friends:
                if friendship['user_id'] == current_user_id:
                    friend_ids.append(ObjectId(friendship['friend_id']))
                else:
                    friend_ids.append(ObjectId(friendship['user_id']))
            
            # Get IDs of users who have pending requests with current user
            pending_requests = friend_requests.find(
                {'$or': [
                    {'sender_id': current_user_id, 'status': 'pending'},
                    {'recipient_id': current_user_id, 'status': 'pending'}
                ]}
            )
            
            pending_ids = []
            for request in pending_requests:
                if request['sender_id'] == current_user_id:
                    pending_ids.append(ObjectId(request['recipient_id']))
                else:
                    pending_ids.append(ObjectId(request['sender_id']))
            
            # Combine all IDs to exclude (friends + pending + self)
            exclude_ids = friend_ids + pending_ids + [ObjectId(current_user_id)]
            
            # Create filter for users search
            filter_query = {'_id': {'$nin': exclude_ids}}
            
            # Add search by name if provided
            if search:
                filter_query['fullName'] = {'$regex': search, '$options': 'i'}
            
            # Query for potential friend suggestions
            total_suggestions = users.count_documents(filter_query)
            suggestions_cursor = users.find(filter_query).skip(skip).limit(limit)
            
            # Format the suggestions
            suggestions = []
            for user in suggestions_cursor:
                profile = get_user_profile(
                    str(user['_id']),
                    include_mutual=True,
                    current_user_id=current_user_id
                )
                suggestions.append(profile)
            
            # Calculate pagination info
            total_pages = (total_suggestions + limit - 1) // limit if total_suggestions > 0 else 1
            
            return {
                'success': True,
                'data': {
                    'suggestions': suggestions,
                    'pagination': {
                        'current_page': page,
                        'total_pages': total_pages,
                        'total_items': total_suggestions,
                        'limit': limit
                    }
                }
            }
        
        def options(self):
            return cors_preflight_response()
    
    # 2. Send Friend Request Endpoint
    @friend_ns.route('/requests')
    class SendFriendRequest(Resource):
        @friend_ns.doc(security='jwt')
        @friend_ns.expect(friend_request_model)
        @friend_ns.response(201, 'Created', friend_request_response_model)
        @friend_ns.response(400, 'Bad Request', error_response)
        @friend_ns.response(409, 'Conflict', error_response)
        @token_required
        def post(current_user_id, self):
            data = request.get_json()
            
            if not data or 'recipient_id' not in data:
                return {
                    'success': False,
                    'error': {
                        'code': 'INVALID_REQUEST',
                        'message': 'Thiếu thông tin người nhận'
                    }
                }, 400
            
            recipient_id = data['recipient_id']
            
            # Check if recipient exists
            if not ObjectId.is_valid(recipient_id):
                return {
                    'success': False,
                    'error': {
                        'code': 'INVALID_REQUEST',
                        'message': 'ID người nhận không hợp lệ'
                    }
                }, 400
                
            recipient = users.find_one({'_id': ObjectId(recipient_id)})
            if not recipient:
                return {
                    'success': False,
                    'error': {
                        'code': 'INVALID_REQUEST',
                        'message': 'Không tìm thấy người dùng'
                    }
                }, 400
            
            # Cannot send request to yourself
            if current_user_id == recipient_id:
                return {
                    'success': False,
                    'error': {
                        'code': 'INVALID_REQUEST',
                        'message': 'Không thể gửi lời mời kết bạn cho chính mình'
                    }
                }, 400
            
            # Check if already friends
            if are_friends(current_user_id, recipient_id):
                return {
                    'success': False,
                    'error': {
                        'code': 'ALREADY_FRIENDS',
                        'message': 'Đã là bạn bè với người này rồi'
                    }
                }, 409
            
            # Check if a request has already been sent
            if has_pending_request(current_user_id, recipient_id):
                return {
                    'success': False,
                    'error': {
                        'code': 'REQUEST_ALREADY_SENT',
                        'message': 'Bạn đã gửi lời mời kết bạn cho người này rồi'
                    }
                }, 409
            
            # Check if recipient already sent a request to current user
            # In this case, we should accept their request instead
            existing_request = friend_requests.find_one({
                'sender_id': recipient_id,
                'recipient_id': current_user_id,
                'status': 'pending'
            })
            
            if existing_request:
                # Update the request status to accepted
                friend_requests.update_one(
                    {'_id': existing_request['_id']},
                    {'$set': {'status': 'accepted', 'updated_at': datetime.now()}}
                )
                
                # Create a new friendship
                friendship_id = friends.insert_one({
                    'user_id': current_user_id,
                    'friend_id': recipient_id,
                    'status': 'accepted',
                    'created_at': datetime.now()
                }).inserted_id
                
                friend_profile = get_user_profile(recipient_id)
                
                return {
                    'success': True,
                    'data': {
                        'friendship_id': str(friendship_id),
                        'friend': friend_profile,
                        'created_at': datetime.now()
                    }
                }, 200
            
            # Create a new friend request
            request_id = friend_requests.insert_one({
                'sender_id': current_user_id,
                'recipient_id': recipient_id,
                'status': 'pending',
                'created_at': datetime.now()
            }).inserted_id
            
            recipient_profile = get_user_profile(recipient_id)
            
            return {
                'success': True,
                'data': {
                    'request_id': str(request_id),
                    'recipient': recipient_profile,
                    'status': 'pending',
                    'created_at': datetime.now()
                }
            }, 201
        
        def options(self):
            return cors_preflight_response()
    
    # 3. Cancel Friend Request Endpoint
    @friend_ns.route('/requests/<string:request_id>')
    class CancelFriendRequest(Resource):
        @friend_ns.doc(security='jwt')
        @friend_ns.response(200, 'Success', friend_request_delete_response)
        @friend_ns.response(403, 'Forbidden', error_response)
        @friend_ns.response(404, 'Not Found', error_response)
        @token_required
        def delete(current_user_id, self, request_id):
            # Check if request exists
            if not ObjectId.is_valid(request_id):
                return {
                    'success': False,
                    'error': {
                        'code': 'REQUEST_NOT_FOUND',
                        'message': 'Không tìm thấy lời mời kết bạn'
                    }
                }, 404
                
            friend_request = friend_requests.find_one({'_id': ObjectId(request_id)})
            if not friend_request:
                return {
                    'success': False,
                    'error': {
                        'code': 'REQUEST_NOT_FOUND',
                        'message': 'Không tìm thấy lời mời kết bạn'
                    }
                }, 404
            
            # Ensure the current user is the sender
            if friend_request['sender_id'] != current_user_id:
                return {
                    'success': False,
                    'error': {
                        'code': 'UNAUTHORIZED_ACTION',
                        'message': 'Bạn không có quyền huỷ lời mời kết bạn này'
                    }
                }, 403
            
            # Delete the request
            friend_requests.delete_one({'_id': ObjectId(request_id)})
            
            return {
                'success': True,
                'data': {
                    'message': 'Đã huỷ lời mời kết bạn'
                }
            }, 200
        
        def options(self, request_id):
            return cors_preflight_response()
    
    # 4. Unfriend User Endpoint
    @friend_ns.route('/<string:friend_id>')
    class UnfriendUser(Resource):
        @friend_ns.doc(security='jwt')
        @friend_ns.response(200, 'Success', friend_request_delete_response)
        @friend_ns.response(404, 'Not Found', error_response)
        @token_required
        def delete(current_user_id, self, friend_id):
            # Delete friendship record (regardless of who initiated it)
            result = friends.delete_one({
                '$or': [
                    {'user_id': current_user_id, 'friend_id': friend_id},
                    {'user_id': friend_id, 'friend_id': current_user_id}
                ]
            })
            
            if result.deleted_count == 0:
                return {
                    'success': False,
                    'error': {
                        'code': 'FRIENDSHIP_NOT_FOUND',
                        'message': 'Mối quan hệ bạn bè không tồn tại'
                    }
                }, 404
            
            # Also clean up any accepted friend request records between these users
            friend_requests.delete_many({
                '$or': [
                    {'sender_id': current_user_id, 'recipient_id': friend_id, 'status': 'accepted'},
                    {'sender_id': friend_id, 'recipient_id': current_user_id, 'status': 'accepted'}
                ]
            })
            
            return {
                'success': True,
                'data': {
                    'message': 'Đã huỷ kết bạn thành công'
                }
            }, 200
        
        def options(self, friend_id):
            return cors_preflight_response()
    
    # 5. Accept Friend Request Endpoint
    @friend_ns.route('/requests/<string:request_id>/accept')
    class AcceptFriendRequest(Resource):
        @friend_ns.doc(security='jwt')
        @friend_ns.response(200, 'Success', friendship_response_model)
        @friend_ns.response(403, 'Forbidden', error_response)
        @friend_ns.response(404, 'Not Found', error_response)
        @token_required
        def patch(current_user_id, self, request_id):
            # Check if request exists
            if not ObjectId.is_valid(request_id):
                return {
                    'success': False,
                    'error': {
                        'code': 'REQUEST_NOT_FOUND',
                        'message': 'Không tìm thấy lời mời kết bạn'
                    }
                }, 404
                
            friend_request = friend_requests.find_one({'_id': ObjectId(request_id)})
            if not friend_request:
                return {
                    'success': False,
                    'error': {
                        'code': 'REQUEST_NOT_FOUND',
                        'message': 'Không tìm thấy lời mời kết bạn'
                    }
                }, 404
            
            # Ensure the current user is the recipient
            if friend_request['recipient_id'] != current_user_id:
                return {
                    'success': False,
                    'error': {
                        'code': 'UNAUTHORIZED_ACTION',
                        'message': 'Bạn không thể chấp nhận lời mời này'
                    }
                }, 403
            
            # Update the request status
            friend_requests.update_one(
                {'_id': ObjectId(request_id)},
                {'$set': {'status': 'accepted', 'updated_at': datetime.now()}}
            )
            
            # Create a new friendship
            sender_id = friend_request['sender_id']
            friendship_id = friends.insert_one({
                'user_id': current_user_id,
                'friend_id': sender_id,
                'status': 'accepted',
                'created_at': datetime.now()
            }).inserted_id
            
            # Get sender's profile
            sender_profile = get_user_profile(sender_id)
            
            return {
                'success': True,
                'data': {
                    'friendship_id': str(friendship_id),
                    'friend': sender_profile,
                    'created_at': datetime.now()
                }
            }, 200
        
        def options(self, request_id):
            return cors_preflight_response()
    
    # 6. Get Received Friend Requests Endpoint
    @friend_ns.route('/requests/received')
    class ReceivedFriendRequests(Resource):
        @friend_ns.doc(security='jwt')
        @friend_ns.response(200, 'Success', received_requests_model)
        @friend_ns.response(401, 'Unauthorized', error_response)
        @token_required
        def get(current_user_id, self):
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 20))
            skip = (page - 1) * limit
            
            # Get received friend requests that are pending
            received_requests_cursor = friend_requests.find({
                'recipient_id': current_user_id,
                'status': 'pending'
            }).sort('created_at', -1).skip(skip).limit(limit)
            
            total_requests = friend_requests.count_documents({
                'recipient_id': current_user_id,
                'status': 'pending'
            })
            
            requests = []
            for req in received_requests_cursor:
                sender_profile = get_user_profile(
                    req['sender_id'], 
                    include_mutual=True,
                    current_user_id=current_user_id
                )
                
                requests.append({
                    'request_id': str(req['_id']),
                    'sender': sender_profile,
                    'created_at': req['created_at']
                })
            
            total_pages = (total_requests + limit - 1) // limit if total_requests > 0 else 1
            
            return {
                'success': True,
                'data': {
                    'requests': requests,
                    'pagination': {
                        'current_page': page,
                        'total_pages': total_pages,
                        'total_items': total_requests,
                        'limit': limit
                    }
                }
            }
        
        def options(self):
            return cors_preflight_response()
    
    # 7. Get Sent Friend Requests Endpoint
    @friend_ns.route('/requests/sent')
    class SentFriendRequests(Resource):
        @friend_ns.doc(security='jwt')
        @friend_ns.response(200, 'Success', sent_requests_model)
        @friend_ns.response(401, 'Unauthorized', error_response)
        @token_required
        def get(current_user_id, self):
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 20))
            skip = (page - 1) * limit
            
            # Get sent friend requests that are pending
            sent_requests_cursor = friend_requests.find({
                'sender_id': current_user_id,
                'status': 'pending'
            }).sort('created_at', -1).skip(skip).limit(limit)
            
            total_requests = friend_requests.count_documents({
                'sender_id': current_user_id,
                'status': 'pending'
            })
            
            requests = []
            for req in sent_requests_cursor:
                recipient_profile = get_user_profile(req['recipient_id'])
                
                requests.append({
                    'request_id': str(req['_id']),
                    'recipient': recipient_profile,
                    'created_at': req['created_at']
                })
            
            total_pages = (total_requests + limit - 1) // limit if total_requests > 0 else 1
            
            return {
                'success': True,
                'data': {
                    'requests': requests,
                    'pagination': {
                        'current_page': page,
                        'total_pages': total_pages,
                        'total_items': total_requests,
                        'limit': limit
                    }
                }
            }
        
        def options(self):
            return cors_preflight_response()
    
    # 8. Check Friend Status Endpoint
    @friend_ns.route('/status/<string:user_id>')
    class CheckFriendStatus(Resource):
        @friend_ns.doc(security='jwt')
        @friend_ns.response(200, 'Success', friend_status_model)
        @friend_ns.response(400, 'Bad Request', error_response)
        @friend_ns.response(401, 'Unauthorized', error_response)
        @token_required
        def get(current_user_id, self, user_id):
            # Validate user ID
            if not ObjectId.is_valid(user_id):
                return {
                    'success': False,
                    'error': {
                        'code': 'INVALID_USER_ID',
                        'message': 'ID người dùng không hợp lệ'
                    }
                }, 400
                
            # Cannot check friendship status with yourself
            if current_user_id == user_id:
                return {
                    'success': False,
                    'error': {
                        'code': 'INVALID_REQUEST',
                        'message': 'Không thể kiểm tra trạng thái kết bạn với chính mình'
                    }
                }, 400
            
            # Check if users are already friends
            friendship = friends.find_one({
                '$or': [
                    {'user_id': current_user_id, 'friend_id': user_id, 'status': 'accepted'},
                    {'user_id': user_id, 'friend_id': current_user_id, 'status': 'accepted'}
                ]
            })
            
            if friendship:
                return {
                    'success': True,
                    'data': {
                        'status': 'friends',
                        'user_id': user_id,
                        'friendship_id': str(friendship['_id'])
                    }
                }
            
            # Check if current user has sent a friend request
            pending_sent = friend_requests.find_one({
                'sender_id': current_user_id,
                'recipient_id': user_id,
                'status': 'pending'
            })
            
            if pending_sent:
                return {
                    'success': True,
                    'data': {
                        'status': 'pending_sent',
                        'user_id': user_id,
                        'request_id': str(pending_sent['_id'])
                    }
                }
            
            # Check if current user has received a friend request
            pending_received = friend_requests.find_one({
                'sender_id': user_id,
                'recipient_id': current_user_id,
                'status': 'pending'
            })
            
            if pending_received:
                return {
                    'success': True,
                    'data': {
                        'status': 'pending_received',
                        'user_id': user_id,
                        'request_id': str(pending_received['_id'])
                    }
                }
            
            # If no relationship exists
            return {
                'success': True,
                'data': {
                    'status': 'not_friends',
                    'user_id': user_id
                }
            }
        
        def options(self, user_id):
            return cors_preflight_response()
    
    # Add namespace to API
    api.add_namespace(friend_ns) 