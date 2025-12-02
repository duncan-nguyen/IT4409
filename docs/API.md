# API Documentation

## Overview
Room API provides RESTful endpoints for managing video conference rooms and user sessions.

Base URL: `http://localhost:4000/api`

## Authentication
Currently, the API uses basic authentication. Include the following header in requests:
```
Authorization: Bearer <token>
```

## Endpoints

### Rooms

#### Create Room
Create a new video conference room.

**Endpoint:** `POST /rooms`

**Request Body:**
```json
{
  "name": "My Room",
  "max_participants": 10
}
```

**Response:** `201 Created`
```json
{
  "roomId": "123e4567-e89b-12d3-a456-426614174000",
  "name": "My Room",
  "participants": 0,
  "maxParticipants": 10,
  "createdAt": "2025-11-06T10:00:00.000Z"
}
```

**Validation:**
- `name`: Required, 1-100 characters
- `max_participants`: Optional, 2-50 (default: 10)

#### List Rooms
Get all available rooms.

**Endpoint:** `GET /rooms`

**Response:** `200 OK`
```json
{
  "rooms": [
    {
      "roomId": "123e4567-e89b-12d3-a456-426614174000",
      "name": "My Room",
      "participants": 3,
      "maxParticipants": 10,
      "createdAt": "2025-11-06T10:00:00.000Z"
    }
  ]
}
```

#### Get Room Details
Get details of a specific room.

**Endpoint:** `GET /rooms/:roomId`

**Response:** `200 OK`
```json
{
  "roomId": "123e4567-e89b-12d3-a456-426614174000",
  "name": "My Room",
  "participants": 3,
  "maxParticipants": 10,
  "createdAt": "2025-11-06T10:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid room ID format
- `404 Not Found`: Room does not exist

#### Join Room
Increment participant count when joining a room.

**Endpoint:** `POST /rooms/:roomId/join`

**Response:** `200 OK`
```json
{
  "message": "Joined room successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Room is full or does not exist

#### Leave Room
Decrement participant count when leaving a room.

**Endpoint:** `POST /rooms/:roomId/leave`

**Response:** `200 OK`
```json
{
  "message": "Left room successfully"
}
```

#### Delete Room
Delete a room.

**Endpoint:** `DELETE /rooms/:roomId`

**Response:** `200 OK`
```json
{
  "message": "Room deleted successfully"
}
```

**Error Responses:**
- `404 Not Found`: Room does not exist

### Analytics

#### Get Statistics
Get overall room statistics.

**Endpoint:** `GET /analytics/stats`

**Response:** `200 OK`
```json
{
  "totalRooms": 15,
  "totalParticipants": 42,
  "avgParticipantsPerRoom": 2.8,
  "maxRoomParticipants": 8
}
```

#### Get Top Active Rooms
Get rooms with most participants.

**Endpoint:** `GET /analytics/activity/top?limit=10`

**Query Parameters:**
- `limit`: Number of rooms to return (default: 10)

**Response:** `200 OK`
```json
{
  "rooms": [
    {
      "roomId": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Popular Room",
      "participants": 8,
      "maxParticipants": 10,
      "createdAt": "2025-11-06T10:00:00.000Z"
    }
  ]
}
```

## Error Handling

All error responses follow this format:
```json
{
  "error": "Error message",
  "details": "Detailed error description (optional)"
}
```

Common HTTP status codes:
- `400 Bad Request`: Invalid input or request
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Rate Limiting
API implements rate limiting of 100 requests per minute per IP address.

## WebSocket Events
For real-time room updates, connect to WebSocket endpoint at `ws://localhost:3001`

Events:
- `room:created`: New room created
- `room:updated`: Room participant count changed
- `room:deleted`: Room deleted
