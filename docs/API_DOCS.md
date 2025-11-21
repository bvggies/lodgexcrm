# API Documentation

## Base URL

- Development: `http://localhost:5000/api`
- Production: `https://your-api-domain.com/api`

## Authentication

Most endpoints require authentication via JWT Bearer token. Include the token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Swagger UI

Interactive API documentation is available at `/api/docs` when the server is running.

## Endpoints

### Authentication

#### POST `/api/auth/register`
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "assistant"
    }
  }
}
```

#### POST `/api/auth/login`
Login and get access tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "assistant"
    }
  }
}
```

#### POST `/api/auth/refresh`
Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_token"
  }
}
```

#### GET `/api/auth/me`
Get current user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "assistant",
      "phone": "+1234567890",
      "isActive": true
    }
  }
}
```

### File Uploads

#### POST `/api/files/upload`
Upload a file to S3-compatible storage.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: File to upload
- `folder`: (optional) Folder path in storage

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "signed_url",
    "key": "uploads/uuid.jpg",
    "bucket": "lodgexcrm-uploads"
  }
}
```

#### GET `/api/files/signed-url/:key`
Get a signed URL for a file.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `expiresIn`: (optional) Expiration time in seconds (default: 3600)

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "signed_url"
  }
}
```

#### DELETE `/api/files/:key`
Delete a file from storage.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "details": [] // Optional validation errors
  }
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Rate Limiting

- General endpoints: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes

## File Upload Limits

- Maximum file size: 10MB
- Allowed types: JPEG, PNG, WebP, PDF, DOC, DOCX

