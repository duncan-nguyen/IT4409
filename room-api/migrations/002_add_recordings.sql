-- Migration: Add room recording and media storage
-- Version: 1.2.0
-- Date: 2025-11-03

-- Create recordings table
CREATE TABLE IF NOT EXISTS recordings (
    id SERIAL PRIMARY KEY,
    recording_id VARCHAR(255) UNIQUE NOT NULL,
    room_id VARCHAR(255) NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
    session_id VARCHAR(255) REFERENCES room_sessions(session_id) ON DELETE SET NULL,
    title VARCHAR(255),
    file_path VARCHAR(500),
    file_size_mb DECIMAL(10, 2),
    duration_seconds INTEGER,
    format VARCHAR(50) DEFAULT 'webm',
    status VARCHAR(50) DEFAULT 'processing',
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create recording_participants table
CREATE TABLE IF NOT EXISTS recording_participants (
    id SERIAL PRIMARY KEY,
    recording_id VARCHAR(255) NOT NULL REFERENCES recordings(recording_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255) REFERENCES room_sessions(session_id) ON DELETE SET NULL,
    joined_at TIMESTAMP NOT NULL,
    left_at TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_recordings_room_id ON recordings(room_id);
CREATE INDEX IF NOT EXISTS idx_recordings_status ON recordings(status);
CREATE INDEX IF NOT EXISTS idx_recordings_created_at ON recordings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recording_participants_recording_id ON recording_participants(recording_id);
CREATE INDEX IF NOT EXISTS idx_recording_participants_user_id ON recording_participants(user_id);
