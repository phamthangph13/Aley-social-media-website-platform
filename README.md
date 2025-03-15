# Website-Social-Media-Aley-Back-End

## HTTPS/SSL Configuration

The application supports HTTPS for secure communication:

### Production (Render)

In production on Render, HTTPS is automatically enabled and managed by Render. All endpoints are served over HTTPS with a valid SSL certificate provided by Render.

### Development Environment

For development, you can enable HTTPS with a self-signed certificate:

1. Generate self-signed certificates:
   ```
   python generate_certs.py
   ```

2. Run the application with SSL enabled:
   ```
   export USE_SSL=True
   python app.py
   ```

The application will start with HTTPS on port 5000 (or the port specified by the PORT environment variable).

### Security Headers

The application implements the following security headers for HTTPS:

- `Strict-Transport-Security`: Enforces HTTPS connections
- `X-Content-Type-Options`: Prevents MIME type sniffing
- `X-Frame-Options`: Prevents clickjacking
- `X-XSS-Protection`: Helps prevent XSS attacks

### Email Links

All email links (verification, password reset) use HTTPS URLs to ensure secure communication.

## CORS Configuration

The application implements Cross-Origin Resource Sharing (CORS) to control which domains can access the API.

### Allowed Origins

By default, the following origins are allowed:
- `https://phamthangph13.github.io`
- `http://localhost:3000`
- `https://localhost:3000`
- `http://localhost:5000`
- `https://localhost:5000`

### Development Mode

For easier development, you can run the server in development mode with permissive CORS:

```
python run_dev.py
```

This script prompts for HTTPS configuration and sets the `DEV_MODE` environment variable to allow all origins (`*`) during development.

### Using the CORS Proxy

If you cannot modify the backend, you can use the included CORS proxy for development:

```
python cors_proxy.py --target http://your-api-url --port 8080
```

Then, in your frontend code, make requests to `http://localhost:8080/endpoint` instead of directly to the API.

### Troubleshooting CORS Issues

If you encounter CORS errors:

1. **Check the Origin** - Make sure your frontend is running on one of the allowed origins.
2. **Certificate Issues** - For HTTPS connections, ensure your development environment trusts the backend's certificate.
3. **Credentials** - If using `credentials: 'include'` in fetch requests, wildcard origins (`*`) won't work; you must specify exact allowed origins.
4. **Preflight Requests** - For non-simple requests, ensure OPTIONS requests are properly handled.
5. **Headers** - Verify that your requests include only allowed headers.

For development, you can temporarily enable permissive CORS by running:

```
DEV_MODE=True python app.py
```