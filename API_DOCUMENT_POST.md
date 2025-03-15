# API Documentation for Posts

This document provides details about the API endpoints related to posts in the system.

## Base URL

All endpoints are relative to the base URL: `/api/posts`

## Authentication

Most endpoints require authentication using a JWT token. The token should be included in the Authorization header as:

```
Authorization: Bearer <token>
```

## Data Models

### Post Model

- `_id`: String - Unique identifier for the post
- `userId`: String - ID of the user who created the post
- `content`: String - Text content of the post
- `mediaUrls`: Array of Strings - URLs of media attached to the post (images, videos)
- `mediaIds`: Array of Strings - IDs of media files stored in GridFS
- `likes`: Array of Strings - IDs of users who liked the post
- `comments`: Array of Objects - Comments on the post
- `shares`: Number - Count of shares
- `createdAt`: Date - When the post was created
- `updatedAt`: Date - When the post was last updated
- `tags`: Array of Strings - Hashtags in the post
- `visibility`: String - Public, Friends, Private
- `location`: Object - Location data (optional)

### Comment Model

- `_id`: String - Unique identifier for the comment
- `userId`: String - ID of the user who created the comment
- `content`: String - Text content of the comment
- `createdAt`: Date - When the comment was created
- `likes`: Array of Strings - IDs of users who liked the comment

## Endpoints

### Create a New Post

**Endpoint:** `POST /`

**Authentication:** Required

**Request Body:**
```json
{
  "content": "This is my post content",
  "media": ["base64 encoded media", "..."],
  "tags": ["hashtag1", "hashtag2"],
  "visibility": "public",
  "location": {
    "name": "Ho Chi Minh City",
    "coordinates": {
      "latitude": 10.762622,
      "longitude": 106.660172
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "post": {
      "id": "60d21b4667d0d8992e610c85",
      "userId": "60d21b4667d0d8992e610c84",
      "content": "This is my post content",
      "mediaUrls": [],
      "mediaIds": ["60d21b4667d0d8992e610c86", "60d21b4667d0d8992e610c87"],
      "likes": [],
      "comments": [],
      "shares": 0,
      "createdAt": "2023-06-22T10:00:00Z",
      "updatedAt": "2023-06-22T10:00:00Z",
      "tags": ["hashtag1", "hashtag2"],
      "visibility": "public",
      "location": {
        "name": "Ho Chi Minh City",
        "coordinates": {
          "latitude": 10.762622,
          "longitude": 106.660172
        }
      }
    }
  }
}
```

### Get Post by ID

**Endpoint:** `GET /:postId`

**Authentication:** Optional (public posts can be viewed without authentication)

**Response:**
```json
{
  "success": true,
  "data": {
    "post": {
      "id": "60d21b4667d0d8992e610c85",
      "userId": "60d21b4667d0d8992e610c84",
      "content": "This is my post content",
      "mediaUrls": ["https://example.com/media1.jpg"],
      "mediaIds": ["60d21b4667d0d8992e610c86"],
      "likes": ["60d21b4667d0d8992e610c88"],
      "comments": [
        {
          "id": "60d21b4667d0d8992e610c89",
          "userId": "60d21b4667d0d8992e610c88",
          "content": "Great post!",
          "createdAt": "2023-06-22T10:30:00Z",
          "likes": []
        }
      ],
      "shares": 1,
      "createdAt": "2023-06-22T10:00:00Z",
      "updatedAt": "2023-06-22T10:30:00Z",
      "tags": ["hashtag1", "hashtag2"],
      "visibility": "public",
      "location": {
        "name": "Ho Chi Minh City"
      },
      "user": {
        "id": "60d21b4667d0d8992e610c84",
        "fullName": "John Doe",
        "avatar": "60d21b4667d0d8992e610c90"
      }
    }
  }
}
```

### Get User's Posts

**Endpoint:** `GET /user/:userId`

**Authentication:** Optional (depends on post visibility)

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "60d21b4667d0d8992e610c85",
        "userId": "60d21b4667d0d8992e610c84",
        "content": "This is my post content",
        "mediaUrls": ["https://example.com/media1.jpg"],
        "mediaIds": ["60d21b4667d0d8992e610c86"],
        "likes": ["60d21b4667d0d8992e610c88"],
        "comments": [],
        "commentCount": 1,
        "shares": 1,
        "createdAt": "2023-06-22T10:00:00Z",
        "updatedAt": "2023-06-22T10:30:00Z",
        "tags": ["hashtag1", "hashtag2"],
        "visibility": "public"
      }
    ],
    "total": 20,
    "page": 1,
    "limit": 10,
    "pages": 2,
    "user": {
      "id": "60d21b4667d0d8992e610c84",
      "fullName": "John Doe",
      "avatar": "60d21b4667d0d8992e610c90"
    }
  }
}
```

### Get Timeline/Feed

**Endpoint:** `GET /timeline`

**Authentication:** Required

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "60d21b4667d0d8992e610c85",
        "userId": "60d21b4667d0d8992e610c84",
        "content": "This is my post content",
        "mediaUrls": ["https://example.com/media1.jpg"],
        "mediaIds": ["60d21b4667d0d8992e610c86"],
        "likes": ["60d21b4667d0d8992e610c88"],
        "comments": [],
        "commentCount": 1,
        "shares": 1,
        "createdAt": "2023-06-22T10:00:00Z",
        "updatedAt": "2023-06-22T10:30:00Z",
        "tags": ["hashtag1", "hashtag2"],
        "visibility": "public",
        "user": {
          "id": "60d21b4667d0d8992e610c84",
          "fullName": "John Doe",
          "avatar": "60d21b4667d0d8992e610c90"
        }
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

### Get Combined Public and Friend Posts

**Endpoint:** `GET /feed/combined`

**Authentication:** Required

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sortBy`: Field to sort by (default: "createdAt")
- `order`: Sort order ("asc" or "desc", default: "desc")

**Description:**
This endpoint returns a combined feed containing both public posts from all users and posts from the current user's friends that have "friends" visibility. The posts are returned in chronological order by default (newest first).

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "60d21b4667d0d8992e610c85",
        "userId": "60d21b4667d0d8992e610c84",
        "content": "This is my post content",
        "mediaUrls": ["https://example.com/media1.jpg"],
        "mediaIds": ["60d21b4667d0d8992e610c86"],
        "likes": ["60d21b4667d0d8992e610c88"],
        "comments": [],
        "commentCount": 1,
        "shares": 1,
        "createdAt": "2023-06-22T10:00:00Z",
        "updatedAt": "2023-06-22T10:30:00Z",
        "tags": ["hashtag1", "hashtag2"],
        "visibility": "public",
        "user": {
          "id": "60d21b4667d0d8992e610c84",
          "fullName": "John Doe",
          "avatar": "60d21b4667d0d8992e610c90"
        }
      },
      {
        "id": "60d21b4667d0d8992e610c86",
        "userId": "60d21b4667d0d8992e610c87",
        "content": "This is a friend-only post",
        "mediaUrls": [],
        "mediaIds": [],
        "likes": [],
        "comments": [],
        "commentCount": 0,
        "shares": 0,
        "createdAt": "2023-06-22T09:00:00Z",
        "updatedAt": "2023-06-22T09:00:00Z",
        "tags": [],
        "visibility": "friends",
        "user": {
          "id": "60d21b4667d0d8992e610c87",
          "fullName": "Friend User",
          "avatar": "60d21b4667d0d8992e610c92"
        }
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

### Update a Post

**Endpoint:** `PUT /:postId`

**Authentication:** Required (only post owner can update)

**Request Body:**
```json
{
  "content": "Updated content for my post",
  "tags": ["newtag1", "newtag2"],
  "visibility": "friends",
  "location": {
    "name": "Da Nang"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Post updated successfully",
  "data": {
    "post": {
      "id": "60d21b4667d0d8992e610c85",
      "content": "Updated content for my post",
      "tags": ["newtag1", "newtag2"],
      "visibility": "friends",
      "location": {
        "name": "Da Nang"
      },
      "updatedAt": "2023-06-23T09:00:00Z"
    }
  }
}
```

### Delete a Post

**Endpoint:** `DELETE /:postId`

**Authentication:** Required (only post owner can delete)

**Response:**
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

### Like/Unlike a Post

**Endpoint:** `POST /:postId/like`

**Authentication:** Required

**Response (like):**
```json
{
  "success": true,
  "message": "Post liked successfully",
  "data": {
    "likeCount": 42
  }
}
```

**Response (unlike):**
```json
{
  "success": true,
  "message": "Post unliked successfully",
  "data": {
    "likeCount": 41
  }
}
```

### Add a Comment

**Endpoint:** `POST /:postId/comments`

**Authentication:** Required

**Request Body:**
```json
{
  "content": "This is my comment!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    "comment": {
      "id": "60d21b4667d0d8992e610c89",
      "userId": "60d21b4667d0d8992e610c88",
      "content": "This is my comment!",
      "createdAt": "2023-06-23T11:30:00Z",
      "likes": [],
      "user": {
        "id": "60d21b4667d0d8992e610c88",
        "fullName": "Jane Smith",
        "avatar": "60d21b4667d0d8992e610c91"
      }
    },
    "commentCount": 12
  }
}
```

### Get Post Comments

**Endpoint:** `GET /:postId/comments`

**Authentication:** Optional (depends on post visibility)

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "60d21b4667d0d8992e610c89",
        "userId": "60d21b4667d0d8992e610c88",
        "content": "This is my comment!",
        "createdAt": "2023-06-23T11:30:00Z",
        "likes": [],
        "user": {
          "id": "60d21b4667d0d8992e610c88",
          "fullName": "Jane Smith",
          "avatar": "60d21b4667d0d8992e610c91"
        }
      }
    ],
    "total": 35,
    "page": 1,
    "limit": 20,
    "pages": 2
  }
}
```

### Delete a Comment

**Endpoint:** `DELETE /:postId/comments/:commentId`

**Authentication:** Required (only comment owner or post owner can delete)

**Response:**
```json
{
  "success": true,
  "message": "Comment deleted successfully",
  "data": {
    "commentCount": 11
  }
}
```

### Like/Unlike a Comment

**Endpoint:** `POST /:postId/comments/:commentId/like`

**Authentication:** Required

**Response (like):**
```json
{
  "success": true,
  "message": "Comment liked successfully",
  "data": {
    "likeCount": 5
  }
}
```

**Response (unlike):**
```json
{
  "success": true,
  "message": "Comment unliked successfully",
  "data": {
    "likeCount": 4
  }
}
```

### Search Posts

**Endpoint:** `GET /search`

**Authentication:** Optional

**Query Parameters:**
- `query`: Search term
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `tags`: Comma-separated list of hashtags to filter by

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "60d21b4667d0d8992e610c85",
        "userId": "60d21b4667d0d8992e610c84",
        "content": "This is my post content with hashtag1",
        "mediaUrls": ["https://example.com/media1.jpg"],
        "mediaIds": ["60d21b4667d0d8992e610c86"],
        "likes": ["60d21b4667d0d8992e610c88"],
        "comments": [],
        "commentCount": 1,
        "shares": 1,
        "createdAt": "2023-06-22T10:00:00Z",
        "updatedAt": "2023-06-22T10:30:00Z",
        "tags": ["hashtag1", "hashtag2"],
        "visibility": "public",
        "user": {
          "id": "60d21b4667d0d8992e610c84",
          "fullName": "John Doe",
          "avatar": "60d21b4667d0d8992e610c90"
        }
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 10,
    "pages": 2
  }
}
```

### Get Media for Post

**Endpoint:** `GET /media/:mediaId`

**Authentication:** Optional (depends on post visibility)

**Response:** The media file (image/video) with appropriate content type header

### Error Responses

All endpoints may return the following error responses:

- **400 Bad Request**
```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "content": "Content is required and must be at most 5000 characters"
    }
  }
}
```

- **401 Unauthorized**
```json
{
  "success": false,
  "message": "Token is missing or invalid"
}
```

- **403 Forbidden**
```json
{
  "success": false,
  "message": "You don't have permission to perform this action"
}
```

- **404 Not Found**
```json
{
  "success": false,
  "message": "Post not found"
}
```

- **500 Server Error**
```json
{
  "success": false,
  "message": "An error occurred",
  "error": {
    "code": "SERVER_ERROR",
    "details": "Internal server error"
  }
}
``` 