import request from 'supertest';
import app from '../src/index';
import pool from '../src/config/database';

describe('Room API Tests', () => {
  let testRoomId: string;

  beforeAll(async () => {
    // Wait for database connection
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Cleanup test data
    if (testRoomId) {
      await pool.query('DELETE FROM rooms WHERE room_id = $1', [testRoomId]);
    }
    await pool.end();
  });

  describe('POST /api/rooms', () => {
    it('should create a new room', async () => {
      const response = await request(app)
        .post('/api/rooms')
        .send({
          name: 'Test Room',
          max_participants: 5
        })
        .expect(201);

      expect(response.body).toHaveProperty('roomId');
      expect(response.body.name).toBe('Test Room');
      expect(response.body.maxParticipants).toBe(5);
      
      testRoomId = response.body.roomId;
    });

    it('should return 400 if room name is missing', async () => {
      const response = await request(app)
        .post('/api/rooms')
        .send({
          max_participants: 5
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if room name is too long', async () => {
      const response = await request(app)
        .post('/api/rooms')
        .send({
          name: 'A'.repeat(101),
          max_participants: 5
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/rooms', () => {
    it('should return list of rooms', async () => {
      const response = await request(app)
        .get('/api/rooms')
        .expect(200);

      expect(response.body).toHaveProperty('rooms');
      expect(Array.isArray(response.body.rooms)).toBe(true);
    });
  });

  describe('GET /api/rooms/:roomId', () => {
    it('should return room details', async () => {
      const response = await request(app)
        .get(`/api/rooms/${testRoomId}`)
        .expect(200);

      expect(response.body.roomId).toBe(testRoomId);
      expect(response.body).toHaveProperty('name');
    });

    it('should return 404 for non-existent room', async () => {
      await request(app)
        .get('/api/rooms/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('should return 400 for invalid room ID format', async () => {
      await request(app)
        .get('/api/rooms/invalid-id')
        .expect(400);
    });
  });

  describe('POST /api/rooms/:roomId/join', () => {
    it('should increment room participants', async () => {
      const response = await request(app)
        .post(`/api/rooms/${testRoomId}/join`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/rooms/:roomId/leave', () => {
    it('should decrement room participants', async () => {
      const response = await request(app)
        .post(`/api/rooms/${testRoomId}/leave`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/analytics/stats', () => {
    it('should return room statistics', async () => {
      const response = await request(app)
        .get('/api/analytics/stats')
        .expect(200);

      expect(response.body).toHaveProperty('totalRooms');
      expect(response.body).toHaveProperty('totalParticipants');
    });
  });
});
