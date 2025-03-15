#!/usr/bin/env python3
"""
Script to generate self-signed SSL certificates for development purposes.
Run this script to create cert.pem and key.pem files needed for HTTPS in development.
"""

import os
import subprocess
import sys

def generate_certificates():
    print("Generating self-signed SSL certificates for development...")
    
    # Check if OpenSSL is available
    try:
        subprocess.run(['openssl', 'version'], check=True, capture_output=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Error: OpenSSL is not installed or not in the PATH.")
        print("Please install OpenSSL and try again.")
        sys.exit(1)
    
    # Generate private key and certificate
    cmd = [
        'openssl', 'req', '-x509', '-newkey', 'rsa:4096', '-nodes',
        '-out', 'cert.pem', '-keyout', 'key.pem', '-days', '365',
        '-subj', '/CN=localhost'
    ]
    
    try:
        subprocess.run(cmd, check=True)
        print("SSL certificates generated successfully!")
        print("- cert.pem: SSL certificate")
        print("- key.pem: SSL private key")
        print("\nTo use HTTPS in development mode, run:")
        print("export USE_SSL=True")
        print("python app.py")
    except subprocess.CalledProcessError as e:
        print(f"Error generating certificates: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Check if certificates already exist
    if os.path.exists('cert.pem') and os.path.exists('key.pem'):
        response = input("SSL certificates already exist. Regenerate? (y/n): ")
        if response.lower() != 'y':
            print("Using existing certificates.")
            sys.exit(0)
    
    generate_certificates() 