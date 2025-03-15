from flask_mail import Message
from flask import current_app, render_template
from threading import Thread

def send_async_email(app, msg):
    with app.app_context():
        app.mail.send(msg)

def send_email(subject, recipients, body, html=None):
    msg = Message(subject, recipients=recipients)
    msg.body = body
    if html:
        msg.html = html

    Thread(target=send_async_email, args=(current_app._get_current_object(), msg)).start()

def send_verification_email(user_email, token, user_name):
    verification_url = f"https://aley-social-media-website-platform.onrender.com /verify?token={token}"
    subject = "Xác thực tài khoản của bạn"
    
    # Email đơn giản không có HTML
    body = f"Xin chào {user_name}, vui lòng nhấp vào liên kết sau để xác thực email của bạn: {verification_url}"
    
    # Email HTML đẹp
    html = render_template('email/verification_email.html', 
                          username=user_name,
                          verification_url=verification_url)
    
    send_email(subject, [user_email], body, html)

def send_password_reset_email(user_email, token, user_name):
    reset_url = f"https://aley-social-media-website-platform.onrender.com /reset-password?token={token}"
    subject = "Yêu cầu đặt lại mật khẩu"
    
    # Email đơn giản không có HTML
    body = f"Xin chào {user_name}, vui lòng nhấp vào liên kết sau để đặt lại mật khẩu: {reset_url}"
    
    # Email HTML đẹp
    html = render_template('email/reset_password_email.html',
                          username=user_name,
                          reset_url=reset_url)
    
    send_email(subject, [user_email], body, html) 