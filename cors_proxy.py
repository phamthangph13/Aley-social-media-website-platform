#!/usr/bin/env python3
"""
Simple CORS proxy for development.
This allows frontend applications to access APIs that don't support CORS.
"""

from flask import Flask, request, Response
import requests
import argparse

app = Flask(__name__)

@app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
def proxy(path):
    # Get the target URL from the command-line argument
    target_url = app.config['TARGET_URL']
    
    # Build the URL to forward to
    url = f"{target_url}/{path}"
    
    # Get query parameters
    params = {}
    for key, value in request.args.items():
        params[key] = value
    
    # Get headers, but remove ones that would cause issues
    headers = {}
    for key, value in request.headers.items():
        if key.lower() not in ['host', 'content-length']:
            headers[key] = value
    
    # Forward the request
    try:
        if request.method == 'OPTIONS':
            # Handle preflight requests
            response = Response()
        else:
            # Forward the request to the target
            resp = requests.request(
                method=request.method,
                url=url,
                headers=headers,
                params=params,
                data=request.get_data(),
                cookies=request.cookies,
                allow_redirects=False,
                timeout=10
            )
            
            # Create a response with the data from the target
            response = Response(resp.content)
            for key, value in resp.headers.items():
                if key.lower() not in ['content-encoding', 'content-length', 'transfer-encoding']:
                    response.headers[key] = value
            
            response.status_code = resp.status_code
        
        # Add CORS headers
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
        return response
    
    except requests.exceptions.RequestException as e:
        return f"Proxy error: {str(e)}", 500

def main():
    parser = argparse.ArgumentParser(description='Simple CORS proxy server')
    parser.add_argument('--target', required=True, help='Target URL to proxy (e.g., http://api.example.com)')
    parser.add_argument('--port', type=int, default=8080, help='Port to run the proxy on (default: 8080)')
    
    args = parser.parse_args()
    
    app.config['TARGET_URL'] = args.target.rstrip('/')
    
    print(f"Starting CORS proxy server on port {args.port}")
    print(f"Proxying requests to: {app.config['TARGET_URL']}")
    print(f"Access your API at: http://localhost:{args.port}/your-api-endpoint")
    print("Press Ctrl+C to stop")
    
    app.run(host='0.0.0.0', port=args.port, debug=True)

if __name__ == '__main__':
    main() 