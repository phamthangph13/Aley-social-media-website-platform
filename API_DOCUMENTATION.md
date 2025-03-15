# Aley Social Media API Documentation

## Overview
This document provides a comprehensive guide to the Aley Social Media API endpoints, their usage, parameters, and responses.

## Base URL
```
http://localhost:5000
```

## Authentication
Most endpoints require authentication using a JWT token.

**Authorization Header Format:**
```
Authorization: Bearer <token>
```

---

## API Endpoints

## Authentication API
Namespace: `/api/auth`

### Register a new user
**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "fullName": "John Doe",
  "dateOfBirth": "1990-01-01",
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "message": "Registration successful. Please check your email to verify your account."
}
```

**Error Responses:**
- `400 Bad Request` - Email already registered
- `400 Bad Request` - User is under 18 years old
- `400 Bad Request` - Invalid date format

### User Login
**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "jwt_token_string",
  "user": {
    "id": "user_id",
    "fullName": "John Doe",
    "email": "user@example.com",
    // other user data
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials

### Verify Email
**Endpoint:** `GET /api/auth/verify/<token>`

**Response (200):**
```json
{
  "message": "Email verified successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid or expired token

### Forgot Password
**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset instructions sent to your email"
}
```

### Reset Password
**Endpoint:** `POST /api/auth/reset-password/<token>`

**Request Body:**
```json
{
  "password": "new_password123"
}
```

**Response (200):**
```json
{
  "message": "Password reset successful"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid or expired token

---

## User API
Namespace: `/api/users`

### Get Current User
**Endpoint:** `GET /api/users/me`

**Authentication:** Required

**Response (200):**
```json
{
  "fullName": "John Doe",
  "email": "user@example.com",
  "dateOfBirth": "1990-01-01",
  "avatar": "image_id",
  "background": "image_id",
  "verifiedTick": false,
  "profileBio": "User bio text"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - User not found

### Get User by ID
**Endpoint:** `GET /api/users/<user_id>`

**Response (200):**
```json
{
  "fullName": "John Doe",
  "email": "user@example.com",
  "dateOfBirth": "1990-01-01",
  "avatar": "image_id",
  "background": "image_id",
  "verifiedTick": false,
  "profileBio": "User bio text"
}
```

**Error Responses:**
- `404 Not Found` - User not found
- `400 Bad Request` - Invalid user ID

### Update User Profile
**Endpoint:** `PUT /api/users/update`

**Authentication:** Required

**Request Body:**
```json
{
  "fullName": "John Smith",           // optional
  "dateOfBirth": "1990-01-01",        // optional
  "avatar": "base64_encoded_image",   // optional
  "background": "base64_encoded_image", // optional
  "profileBio": "Updated bio text"    // optional
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Cập nhật thông tin thành công",
  "data": {
    "user": {
      // Updated user data
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `400 Bad Request` - Validation errors
- `500 Server Error` - Server processing error

### Get User Image
**Endpoint:** `GET /api/users/image/<image_id>`

**Response:** The image file

**Error Responses:**
- `404 Not Found` - Image not found
- `400 Bad Request` - Invalid image ID

### List Users
**Endpoint:** `GET /api/users/list`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200):**
```json
{
  "users": [
    // Array of user objects
  ],
  "total": 42,
  "page": 1,
  "limit": 10,
  "pages": 5
}
```

### Search Users
**Endpoint:** `GET /api/users/search`

**Query Parameters:**
- `query`: Search query string
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200):**
```json
{
  "users": [
    // Array of matching user objects
  ],
  "total": 15,
  "page": 1,
  "limit": 10,
  "pages": 2
}
```

---

## Posts API
Namespace: `/api/posts`

### Create Post
**Endpoint:** `POST /api/posts`

**Authentication:** Required

**Request Body:**
```json
{
  "content": "Post content",
  "media": [
    {
      "data": "base64_encoded_media",
      "type": "image/jpeg"
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "post": {
      // Post data
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `400 Bad Request` - Validation errors

### List Posts
**Endpoint:** `GET /api/posts/list`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200):**
```json
{
  "posts": [
    // Array of post objects
  ],
  "total": 42,
  "page": 1,
  "limit": 10,
  "pages": 5
}
```

### Get Post by ID
**Endpoint:** `GET /api/posts/<post_id>`

**Response (200):**
```json
{
  // Post data with author information
}
```

**Error Responses:**
- `404 Not Found` - Post not found
- `400 Bad Request` - Invalid post ID

### Update Post
**Endpoint:** `PUT /api/posts/<post_id>`

**Authentication:** Required

**Request Body:**
```json
{
  "content": "Updated post content",
  "media": [
    // Optional media updates
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Post updated successfully",
  "data": {
    "post": {
      // Updated post data
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Not authorized to update this post
- `404 Not Found` - Post not found

### Delete Post
**Endpoint:** `DELETE /api/posts/<post_id>`

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Not authorized to delete this post
- `404 Not Found` - Post not found

### Like Post
**Endpoint:** `POST /api/posts/<post_id>/like`

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "message": "Post liked/unliked successfully",
  "data": {
    "liked": true,
    "likesCount": 42
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Post not found

### Get User Feed
**Endpoint:** `GET /api/posts/feed`

**Authentication:** Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200):**
```json
{
  "posts": [
    // Array of post objects from followed users
  ],
  "total": 42,
  "page": 1,
  "limit": 10,
  "pages": 5
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token

### Get User Posts
**Endpoint:** `GET /api/posts/user/<user_id>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200):**
```json
{
  "posts": [
    // Array of post objects from specified user
  ],
  "total": 15,
  "page": 1,
  "limit": 10,
  "pages": 2
}
```

**Error Responses:**
- `404 Not Found` - User not found

### Get Media
**Endpoint:** `GET /api/media/<media_id>`

**Response:** The media file (image/video)

**Error Responses:**
- `404 Not Found` - Media not found
- `400 Bad Request` - Invalid media ID

---

## Error Response Format
Most error responses follow this format:

```json
{
  "success": false,
  "message": "Error message",
  "error": {
    "code": "ERROR_CODE",
    "details": {} // Additional error details
  }
}
```

---

## Models

### User Model
```json
{
  "id": "ObjectId",
  "fullName": "String",
  "email": "String",
  "dateOfBirth": "Date (YYYY-MM-DD)",
  "avatar": "String (image_id)",
  "background": "String (image_id)",
  "isVerified": "Boolean",
  "verifiedTick": "Boolean",
  "profileBio": "String",
  "created_at": "DateTime"
}
```

### Post Model
```json
{
  "id": "ObjectId",
  "author": "ObjectId (user_id)",
  "content": "String",
  "media": [
    {
      "id": "String",
      "type": "String (mime type)",
      "url": "String (URL)"
    }
  ],
  "likes": ["ObjectId (user_ids)"],
  "likesCount": "Number",
  "created_at": "DateTime",
  "updated_at": "DateTime"
}
```

---

## Rate Limiting
The API currently does not implement rate limiting.

## Changes and Updates
This documentation will be updated as the API evolves. 