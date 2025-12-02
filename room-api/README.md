# CNWeb Room API

REST API for managing video call rooms.

## API Endpoints

### Rooms

#### Create Room
```
POST /api/rooms
Content-Type: application/json

{
  "name": "My Room",
  "max_participants": 10
}

Response: 201 Created
{
  "roomId": "uuid",
  "name": "My Room",
  "participants": 0,
  "maxParticipants": 10,
  "createdAt": "2023-11-16T..."
}
```

#### Get All Rooms
```
GET /api/rooms

Response: 200 OK
{
  "rooms": [
    {
      "roomId": "uuid",
      "name": "Room 1",
      "participants": 2,
      "maxParticipants": 10,
      "createdAt": "2023-11-16T..."
    }
  ]
}
```

#### Get Room by ID
```
GET /api/rooms/:roomId

Response: 200 OK
{
  "roomId": "uuid",
  "name": "My Room",
  "participants": 3,
  "maxParticipants": 10,
  "createdAt": "2023-11-16T..."
}
```

#### Join Room
```
POST /api/rooms/:roomId/join

Response: 200 OK
{
  "message": "Joined room successfully"
}
```

#### Leave Room
```
POST /api/rooms/:roomId/leave

Response: 200 OK
{
  "message": "Left room successfully"
}
```

#### Delete Room
```
DELETE /api/rooms/:roomId

Response: 200 OK
{
  "message": "Room deleted successfully"
}
```

### Authentication (Optional)

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "user123",
  "email": "user@example.com",
  "password": "password123"
}

Response: 201 Created
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "user123",
    "email": "user@example.com"
  },
  "token": "jwt-token"
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "user123",
  "password": "password123"
}

Response: 200 OK
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "user123",
    "email": "user@example.com"
  },
  "token": "jwt-token"
}
```

## Development

```bash
npm install
npm run dev
```

## Environment Variables

See `.env.example` for required environment variables.
