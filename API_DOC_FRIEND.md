# API Documentation: Friend Management System

## Table of Contents
1. [Get Friend Suggestions (Non-Friends)](#1-get-friend-suggestions)
2. [Send Friend Request](#2-send-friend-request)
3. [Cancel Friend Request](#3-cancel-friend-request)
4. [Unfriend User](#4-unfriend-user)
5. [Accept Friend Request](#5-accept-friend-request)
6. [Get Received Friend Requests](#6-get-received-friend-requests)
7. [Get Sent Friend Requests](#7-get-sent-friend-requests)

---

## 1. Get Friend Suggestions

Endpoint to retrieve users who are not connected with the current user.

### Request

```
GET /api/friends/suggestions
```

**Headers:**
- `Authorization`: Bearer {token}

**Query Parameters:**
- `page` (optional): Page number for pagination. Default: 1
- `limit` (optional): Number of results per page. Default: 20
- `search` (optional): Search term to filter suggestions by name

### Response

**Success (200 OK)**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "user_id": "123456789",
        "name": "Trần Văn A",
        "avatar": "https://example.com/avatar.jpg",
        "mutual_friends_count": 5,
        "bio": "Xin chào, tôi là Trần Văn A"
      },
      {
        "user_id": "987654321",
        "name": "Nguyễn Thị B",
        "avatar": "https://example.com/avatar2.jpg",
        "mutual_friends_count": 2,
        "bio": "Chào mọi người"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 98,
      "limit": 20
    }
  }
}
```

**Error (401 Unauthorized)**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Bạn cần đăng nhập để sử dụng tính năng này"
  }
}
```

---

## 2. Send Friend Request

Endpoint to send a friend request to another user.

### Request

```
POST /api/friends/requests
```

**Headers:**
- `Authorization`: Bearer {token}
- `Content-Type`: application/json

**Body:**
```json
{
  "recipient_id": "987654321"
}
```

### Response

**Success (201 Created)**
```json
{
  "success": true,
  "data": {
    "request_id": "req_12345",
    "recipient": {
      "user_id": "987654321",
      "name": "Nguyễn Thị B",
      "avatar": "https://example.com/avatar2.jpg"
    },
    "status": "pending",
    "created_at": "2023-08-10T15:30:45Z"
  }
}
```

**Error (400 Bad Request)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Không thể gửi lời mời kết bạn"
  }
}
```

**Error (409 Conflict)**
```json
{
  "success": false,
  "error": {
    "code": "REQUEST_ALREADY_SENT",
    "message": "Bạn đã gửi lời mời kết bạn cho người này rồi"
  }
}
```

---

## 3. Cancel Friend Request

Endpoint to cancel a previously sent friend request.

### Request

```
DELETE /api/friends/requests/{request_id}
```

**Headers:**
- `Authorization`: Bearer {token}

### Response

**Success (200 OK)**
```json
{
  "success": true,
  "data": {
    "message": "Đã huỷ lời mời kết bạn"
  }
}
```

**Error (404 Not Found)**
```json
{
  "success": false,
  "error": {
    "code": "REQUEST_NOT_FOUND",
    "message": "Không tìm thấy lời mời kết bạn"
  }
}
```

**Error (403 Forbidden)**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED_ACTION",
    "message": "Bạn không có quyền huỷ lời mời kết bạn này"
  }
}
```

---

## 4. Unfriend User

Endpoint to remove a user from friend list.

### Request

```
DELETE /api/friends/{friend_id}
```

**Headers:**
- `Authorization`: Bearer {token}

### Response

**Success (200 OK)**
```json
{
  "success": true,
  "data": {
    "message": "Đã huỷ kết bạn thành công"
  }
}
```

**Error (404 Not Found)**
```json
{
  "success": false,
  "error": {
    "code": "FRIENDSHIP_NOT_FOUND",
    "message": "Mối quan hệ bạn bè không tồn tại"
  }
}
```

---

## 5. Accept Friend Request

Endpoint to accept a pending friend request.

### Request

```
PATCH /api/friends/requests/{request_id}/accept
```

**Headers:**
- `Authorization`: Bearer {token}

### Response

**Success (200 OK)**
```json
{
  "success": true,
  "data": {
    "friendship_id": "fr_78901",
    "friend": {
      "user_id": "123456789",
      "name": "Trần Văn A",
      "avatar": "https://example.com/avatar.jpg"
    },
    "created_at": "2023-08-11T09:45:22Z"
  }
}
```

**Error (404 Not Found)**
```json
{
  "success": false,
  "error": {
    "code": "REQUEST_NOT_FOUND",
    "message": "Không tìm thấy lời mời kết bạn"
  }
}
```

**Error (403 Forbidden)**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED_ACTION",
    "message": "Bạn không thể chấp nhận lời mời này"
  }
}
```

---

## 6. Get Received Friend Requests

Endpoint to retrieve the list of friend requests received by the current user.

### Request

```
GET /api/friends/requests/received
```

**Headers:**
- `Authorization`: Bearer {token}

**Query Parameters:**
- `page` (optional): Page number for pagination. Default: 1
- `limit` (optional): Number of results per page. Default: 20

### Response

**Success (200 OK)**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "request_id": "req_12345",
        "sender": {
          "user_id": "123456789",
          "name": "Trần Văn A",
          "avatar": "https://example.com/avatar.jpg",
          "mutual_friends_count": 3
        },
        "created_at": "2023-08-10T15:30:45Z"
      },
      {
        "request_id": "req_67890",
        "sender": {
          "user_id": "567890123",
          "name": "Lê Thị C",
          "avatar": "https://example.com/avatar3.jpg",
          "mutual_friends_count": 1
        },
        "created_at": "2023-08-09T12:15:30Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 1,
      "total_items": 2,
      "limit": 20
    }
  }
}
```

**Error (401 Unauthorized)**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Bạn cần đăng nhập để sử dụng tính năng này"
  }
}
```

---

## 7. Get Sent Friend Requests

Endpoint to retrieve the list of friend requests sent by the current user.

### Request

```
GET /api/friends/requests/sent
```

**Headers:**
- `Authorization`: Bearer {token}

**Query Parameters:**
- `page` (optional): Page number for pagination. Default: 1
- `limit` (optional): Number of results per page. Default: 20

### Response

**Success (200 OK)**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "request_id": "req_54321",
        "recipient": {
          "user_id": "987654321",
          "name": "Nguyễn Thị B",
          "avatar": "https://example.com/avatar2.jpg"
        },
        "created_at": "2023-08-11T10:20:15Z"
      },
      {
        "request_id": "req_09876",
        "recipient": {
          "user_id": "345678901",
          "name": "Phạm Văn D",
          "avatar": "https://example.com/avatar4.jpg"
        },
        "created_at": "2023-08-11T09:05:22Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 1,
      "total_items": 2,
      "limit": 20
    }
  }
}
```

**Error (401 Unauthorized)**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Bạn cần đăng nhập để sử dụng tính năng này"
  }
}
``` 