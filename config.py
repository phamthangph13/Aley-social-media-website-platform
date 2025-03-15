import os
from datetime import timedelta

class Config:
    # MongoDB Configuration
    MONGO_URI = "mongodb+srv://winnieph13:4lICeRJJUAiDTpBL@aleyserver.onwo6.mongodb.net/Aley?retryWrites=true&w=majority&appName=AleyServer"
    
    # JWT Configuration
    SECRET_KEY = "9fc47fa2b895110bdd6c0368414b8e01ef179dfa80f5a9192c692656764b6c20"  # Randomly generated secret key
    JWT_SECRET_KEY = "692a4b729d443c83351c1322fe576889d4845d45c791fb40c254c8b101332ab4" # Randomly generated JWT secret key
    JWT_ACCESS_TOKEN_EXPIRES = False
    
    # Mail Configuration
    MAIL_SERVER = "smtp.gmail.com"
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = "dounecompany@gmail.com"
    MAIL_PASSWORD = "zasa vbpy arko snov"
    MAIL_DEFAULT_SENDER = "dounecompany@gmail.com" 