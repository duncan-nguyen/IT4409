-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    participants INTEGER DEFAULT 0,
    max_participants INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table (optional, for authentication)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rooms_room_id ON rooms(room_id);
CREATE INDEX IF NOT EXISTS idx_rooms_participants ON rooms(participants, max_participants);
CREATE INDEX IF NOT EXISTS idx_rooms_created_at ON rooms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create room_sessions table for tracking user sessions
CREATE TABLE IF NOT EXISTS room_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    room_id VARCHAR(255) NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    peer_id VARCHAR(255),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    duration_seconds INTEGER,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create room_messages table for chat history
CREATE TABLE IF NOT EXISTS room_messages (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(255) NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255) REFERENCES room_sessions(session_id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create room_settings table for custom room configurations
CREATE TABLE IF NOT EXISTS room_settings (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(255) UNIQUE NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
    is_locked BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255),
    recording_enabled BOOLEAN DEFAULT FALSE,
    chat_enabled BOOLEAN DEFAULT TRUE,
    screen_share_enabled BOOLEAN DEFAULT TRUE,
    max_video_quality VARCHAR(20) DEFAULT '1080p',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create additional indexes for new tables
CREATE INDEX IF NOT EXISTS idx_room_sessions_room_id ON room_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_room_sessions_user_id ON room_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_room_sessions_active ON room_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_created_at ON room_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_settings_room_id ON room_settings(room_id);

-- Trigger for room_settings updated_at
CREATE TRIGGER update_room_settings_updated_at BEFORE UPDATE ON room_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate session duration on leave
CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.left_at IS NOT NULL AND OLD.left_at IS NULL THEN
        NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.left_at - NEW.joined_at));
        NEW.is_active = FALSE;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to calculate duration when user leaves
CREATE TRIGGER update_session_duration BEFORE UPDATE ON room_sessions
FOR EACH ROW EXECUTE FUNCTION calculate_session_duration();
