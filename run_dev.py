#!/usr/bin/env python3
"""
Helper script to run the application in development mode with appropriate CORS settings.
This makes it easier to test with frontend applications from different origins.
"""

import os
import sys
import subprocess

def run_dev_server():
    """Run the Flask server in development mode with CORS enabled."""
    print("Starting development server with CORS enabled...")
    
    # Set environment variables
    env = os.environ.copy()
    env["DEV_MODE"] = "True"  # Enable permissive CORS
    
    # Ask about SSL
    use_ssl = input("Use HTTPS with self-signed certificates? (y/n): ").lower() == 'y'
    if use_ssl:
        env["USE_SSL"] = "True"
        
        # Check if certificates exist
        if not (os.path.exists('cert.pem') and os.path.exists('key.pem')):
            print("SSL certificates not found. Generating...")
            try:
                from generate_certs import generate_certificates
                generate_certificates()
            except ImportError:
                print("Error: Could not import generate_certs.py")
                print("Make sure generate_certs.py is in the same directory.")
                sys.exit(1)
    
    # Run the server
    cmd = [sys.executable, "app.py"]
    try:
        subprocess.run(cmd, env=env)
    except KeyboardInterrupt:
        print("\nDevelopment server stopped")

if __name__ == "__main__":
    run_dev_server() 