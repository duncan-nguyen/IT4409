import { Request, Response, Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { validateRoomId, validateRoomInput } from '../middleware/validation';
import { CreateRoomInput, Room } from '../types';

const router = Router();

// Create a new room
router.post('/', validateRoomInput, async (req: Request, res: Response) => {
  try {
    const { name, max_participants = 10 }: CreateRoomInput = req.body;

    const roomId = uuidv4();

    const result = await pool.query<Room>(
      `INSERT INTO rooms (room_id, name, max_participants) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [roomId, name.trim(), max_participants]
    );

    const room = result.rows[0];

    res.status(201).json({
      roomId: room.room_id,
      name: room.name,
      participants: room.participants,
      maxParticipants: room.max_participants,
      createdAt: room.created_at,
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get all active rooms
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query<Room>(
      `SELECT * FROM rooms 
       WHERE participants < max_participants 
       ORDER BY created_at DESC 
       LIMIT 50`
    );

    const rooms = result.rows.map((room) => ({
      roomId: room.room_id,
      name: room.name,
      participants: room.participants,
      maxParticipants: room.max_participants,
      createdAt: room.created_at,
    }));

    res.json({ rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Get room by ID
router.get('/:roomId', validateRoomId, async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;

    const result = await pool.query<Room>(
      'SELECT * FROM rooms WHERE room_id = $1',
      [roomId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const room = result.rows[0];

    res.json({
      roomId: room.room_id,
      name: room.name,
      participants: room.participants,
      maxParticipants: room.max_participants,
      createdAt: room.created_at,
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Increment room participants
router.post('/:roomId/join', validateRoomId, async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;

    const result = await pool.query<Room>(
      `UPDATE rooms 
       SET participants = participants + 1 
       WHERE room_id = $1 AND participants < max_participants 
       RETURNING *`,
      [roomId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Room is full or does not exist' });
    }

    res.json({ message: 'Joined room successfully' });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// Decrement room participants
router.post('/:roomId/leave', validateRoomId, async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;

    await pool.query(
      `UPDATE rooms 
       SET participants = GREATEST(0, participants - 1) 
       WHERE room_id = $1`,
      [roomId]
    );

    res.json({ message: 'Left room successfully' });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ error: 'Failed to leave room' });
  }
});

// Delete room
router.delete('/:roomId', validateRoomId, async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;

    const result = await pool.query(
      'DELETE FROM rooms WHERE room_id = $1 RETURNING *',
      [roomId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

export default router;
