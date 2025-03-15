from flask import request, jsonify, make_response, render_template, Blueprint, redirect, url_for
from flask_restx import Namespace, Resource, fields
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt
from bson import ObjectId
from pymongo import MongoClient
from config import Config
from utils.email import send_verification_email, send_password_reset_email
import bcrypt

# MongoDB setup
client = MongoClient(Config.MONGO_URI)
db = client.Aley
users = db.users

def register_routes(api):
    # Create namespace
    auth_ns = Namespace('api/auth', description='Authentication operations')
    
    # Models
    user_model = api.model('User', {
        'fullName': fields.String(required=True, description='User full name'),
        'dateOfBirth': fields.Date(required=True, description='User date of birth'),
        'email': fields.String(required=True, description='User email'),
        'password': fields.String(required=True, description='User password')
    })

    login_model = api.model('Login', {
        'email': fields.String(required=True, description='User email'),
        'password': fields.String(required=True, description='User password')
    })

    reset_password_model = api.model('ResetPassword', {
        'email': fields.String(required=True, description='User email')
    })

    new_password_model = api.model('NewPassword', {
        'password': fields.String(required=True, description='New password')
    })

    # Helper function for OPTIONS requests
    def cors_preflight_response():
        response = make_response()
        # We'll let the decorator in app.py handle the specific origin
        response.status_code = 200
        return response

    @auth_ns.route('/register')
    class Register(Resource):
        @auth_ns.expect(user_model)
        def post(self):
            data = request.get_json()
            
            # Check if email already exists
            if users.find_one({'email': data['email']}):
                return {'message': 'Email already registered'}, 400
            
            # Check if user is at least 18 years old
            try:
                date_of_birth = datetime.strptime(data['dateOfBirth'], '%Y-%m-%d')
                today = datetime.utcnow()
                age = today.year - date_of_birth.year - ((today.month, today.day) < (date_of_birth.month, date_of_birth.day))
                
                if age < 18:
                    return {'message': 'Bạn chưa đủ 18 tuổi để đăng ký tài khoản'}, 400
            except ValueError:
                return {'message': 'Định dạng ngày sinh không hợp lệ'}, 400
                
            # Hash password
            salt = bcrypt.gensalt()
            hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), salt)
            
            # Create user document
            user = {
                'fullName': data['fullName'],
                'dateOfBirth': data['dateOfBirth'],
                'email': data['email'],
                'password': hashed_password,
                'avatar': 'https://server-avatar.nimostatic.tv/1629531402370/202402111707658017652_1629531402370_avatar.png',
                'background': 'https://cellphones.com.vn/sforum/wp-content/uploads/2024/04/anh-bia-facebook-27.jpg',
                'isVerified': False,
                'verifiedTick': False,
                'created_at': datetime.utcnow(),
                'profile-bio': 'No bio yet.',
            }
            
            # Insert user into database
            result = users.insert_one(user)
            
            # Generate verification token
            token = jwt.encode(
                {'user_id': str(result.inserted_id), 'exp': datetime.utcnow() + timedelta(hours=24)},
                Config.JWT_SECRET_KEY,
                algorithm='HS256'
            )
            
            # Send verification email
            send_verification_email(data['email'], token, data['fullName'])
            
            return {'message': 'Registration successful. Please check your email to verify your account.'}, 201

        def options(self):
            return cors_preflight_response()

    @auth_ns.route('/login')
    class Login(Resource):
        @auth_ns.expect(login_model)
        def post(self):
            data = request.get_json()
            
            # Find user
            user = users.find_one({'email': data['email']})
            if not user:
                return {'message': 'Invalid email or password'}, 401
                
            # Check password
            if not bcrypt.checkpw(data['password'].encode('utf-8'), user['password']):
                return {'message': 'Invalid email or password'}, 401
                
            # Check if email is verified
            if not user['isVerified']:
                return {'message': 'Please verify your email first'}, 401
                
            # Generate JWT token
            token = jwt.encode(
                {'user_id': str(user['_id']), 'exp': datetime.utcnow() + timedelta(hours=1)},
                Config.JWT_SECRET_KEY,
                algorithm='HS256'
            )
            
            return {'token': token}, 200

        def options(self):
            return cors_preflight_response()

    @auth_ns.route('/verify/<token>')
    class VerifyEmail(Resource):
        def get(self, token):
            try:
                # Decode the token
                payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
                user_id = payload['user_id']
                
                # Update user verification status
                users.update_one(
                    {'_id': ObjectId(user_id)},
                    {'$set': {'isVerified': True}}
                )
                
                # Luôn trả về JSON để JavaScript có thể xử lý
                return {'message': 'Email verified successfully'}, 200
                    
            except jwt.ExpiredSignatureError:
                error_message = 'Liên kết xác thực đã hết hạn. Link xác minh danh tính tài khoản chỉ có hiệu lực trong 24 giờ.'
                return {'message': error_message}, 400
                
            except jwt.InvalidTokenError:
                error_message = 'Liên kết xác thực không hợp lệ'
                return {'message': error_message}, 400
                
            except Exception as e:
                error_message = f'Đã xảy ra lỗi: {str(e)}'
                return {'message': error_message}, 500

        def options(self, token):
            return cors_preflight_response()

    @auth_ns.route('/verify-result/<status>')
    class VerifyResult(Resource):
        def get(self, status):
            if status == 'success':
                return make_response(render_template('verify_success.html'), 200)
            elif status == 'error':
                error_message = request.args.get('error', 'Đã xảy ra lỗi không xác định')
                return make_response(render_template('verify_error.html', error_message=error_message), 400)
            else:
                return make_response(render_template('verify_error.html', error_message='Trạng thái xác thực không hợp lệ'), 400)

        def options(self, status):
            return cors_preflight_response()

    @auth_ns.route('/forgot-password')
    class ForgotPassword(Resource):
        @auth_ns.expect(reset_password_model)
        def post(self):
            data = request.get_json()
            user = users.find_one({'email': data['email']})
            
            if not user:
                return {'message': 'Email not found'}, 404
                
            # Generate reset token with current timestamp
            current_time = datetime.utcnow()
            token = jwt.encode(
                {
                    'user_id': str(user['_id']), 
                    'exp': current_time + timedelta(hours=24),
                    'iat': current_time  # Thêm thời gian phát hành token
                },
                Config.JWT_SECRET_KEY,
                algorithm='HS256'
            )
            
            # Send reset password email
            send_password_reset_email(data['email'], token, user['fullName'])
            
            return {'message': 'Password reset instructions sent to your email'}, 200

        def options(self):
            return cors_preflight_response()

    @auth_ns.route('/reset-password/<token>')
    class ResetPassword(Resource):
        def get(self, token):
            """Xử lý truy cập trực tiếp vào link reset mật khẩu từ email."""
            try:
                # Kiểm tra token có hợp lệ không
                payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
                user_id = payload['user_id']
                
                # Kiểm tra xem token đã được sử dụng chưa bằng cách 
                # kiểm tra trong DB có flag passwordUsedTokens chứa token này không
                user = users.find_one({'_id': ObjectId(user_id)})
                if user and 'passwordUsedTokens' in user and token in user['passwordUsedTokens']:
                    error_message = 'Liên kết đặt lại mật khẩu này đã được sử dụng. Vui lòng yêu cầu link mới.'
                    return make_response(render_template('reset_error.html', error_message=error_message), 400)
                    
                # Chuyển hướng đến trang reset mật khẩu
                return redirect(f"/reset-password?token={token}")
            except jwt.ExpiredSignatureError:
                error_message = 'Liên kết đặt lại mật khẩu đã hết hạn. Link đặt lại mật khẩu chỉ có hiệu lực trong 24 giờ.'
                return make_response(render_template('reset_error.html', error_message=error_message), 400)
            except jwt.InvalidTokenError:
                error_message = 'Liên kết đặt lại mật khẩu không hợp lệ'
                return make_response(render_template('reset_error.html', error_message=error_message), 400)
            except Exception as e:
                error_message = f'Đã xảy ra lỗi: {str(e)}'
                return make_response(render_template('reset_error.html', error_message=error_message), 500)
                
        @auth_ns.expect(new_password_model)
        def post(self, token):
            try:
                # Giải mã token
                payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
                user_id = payload['user_id']
                
                # Kiểm tra xem token đã được sử dụng chưa bằng cách
                # kiểm tra trong DB có flag passwordUsedTokens chứa token này không
                user = users.find_one({'_id': ObjectId(user_id)})
                if user and 'passwordUsedTokens' in user and token in user['passwordUsedTokens']:
                    return {'message': 'Liên kết đặt lại mật khẩu này đã được sử dụng. Vui lòng yêu cầu link mới.'}, 400
                
                data = request.get_json()
                
                # Hash new password
                salt = bcrypt.gensalt()
                hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), salt)
                
                # Cập nhật mật khẩu và thêm token vào danh sách đã sử dụng
                # Sử dụng $addToSet để đảm bảo không có token trùng lặp
                users.update_one(
                    {'_id': ObjectId(user_id)},
                    {
                        '$set': {'password': hashed_password},
                        '$addToSet': {'passwordUsedTokens': token}
                    }
                )
                
                return {'message': 'Password reset successfully'}, 200
            except jwt.ExpiredSignatureError:
                return {'message': 'Liên kết đặt lại mật khẩu đã hết hạn. Link đặt lại mật khẩu chỉ có hiệu lực trong 24 giờ.'}, 400
            except jwt.InvalidTokenError:
                return {'message': 'Liên kết đặt lại mật khẩu không hợp lệ'}, 400
            except Exception as e:
                return {'message': f'Đã xảy ra lỗi: {str(e)}'}, 500

        def options(self, token):
            return cors_preflight_response()

    @auth_ns.route('/reset-result/<status>')
    class ResetResult(Resource):
        def get(self, status):
            if status == 'success':
                return make_response(render_template('reset_success.html'), 200)
            elif status == 'error':
                error_message = request.args.get('error', 'Đã xảy ra lỗi không xác định')
                return make_response(render_template('reset_error.html', error_message=error_message), 400)
            else:
                return make_response(render_template('reset_error.html', error_message='Trạng thái không hợp lệ'), 400)

        def options(self, status):
            return cors_preflight_response()

    # Add namespace to API
    api.add_namespace(auth_ns) 