import { Router, Request, Response } from 'express';
import pool from '../config/database';

const router = Router();

// Get room statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_rooms,
        SUM(participants) as total_participants,
        AVG(participants) as avg_participants_per_room,
        MAX(participants) as max_room_participants
      FROM rooms
    `);

    const stats = result.rows[0];

    res.json({
      totalRooms: parseInt(stats.total_rooms) || 0,
      totalParticipants: parseInt(stats.total_participants) || 0,
      avgParticipantsPerRoom: parseFloat(stats.avg_participants_per_room) || 0,
      maxRoomParticipants: parseInt(stats.max_room_participants) || 0,
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get room activity (rooms with most participants)
router.get('/activity/top', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await pool.query(`
      SELECT 
        room_id,
        name,
        participants,
        max_participants,
        created_at
      FROM rooms
      WHERE participants > 0
      ORDER BY participants DESC, created_at DESC
      LIMIT $1
    `, [limit]);

    const rooms = result.rows.map(room => ({
      roomId: room.room_id,
      name: room.name,
      participants: room.participants,
      maxParticipants: room.max_participants,
      createdAt: room.created_at,
    }));

    res.json({ rooms });
  } catch (error) {
    console.error('Error fetching top active rooms:', error);
    res.status(500).json({ error: 'Failed to fetch top active rooms' });
  }
});

export default router;
