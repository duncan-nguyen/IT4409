import { NextFunction, Request, Response } from 'express';

export const validateRoomInput = (req: Request, res: Response, next: NextFunction) => {
    const { name, max_participants } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
            error: 'Invalid input',
            details: 'Room name is required and must be a non-empty string'
        });
    }

    if (name.length > 100) {
        return res.status(400).json({
            error: 'Invalid input',
            details: 'Room name must not exceed 100 characters'
        });
    }

    if (max_participants !== undefined) {
        const maxParticipants = parseInt(max_participants);
        if (isNaN(maxParticipants) || maxParticipants < 2 || maxParticipants > 50) {
            return res.status(400).json({
                error: 'Invalid input',
                details: 'Max participants must be a number between 2 and 50'
            });
        }
    }

    next();
};

export const validateRoomId = (req: Request, res: Response, next: NextFunction) => {
    const { roomId } = req.params;

    // Basic UUID v4 validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(roomId)) {
        return res.status(400).json({
            error: 'Invalid room ID format',
            details: 'Room ID must be a valid UUID'
        });
    }

    next();
};
