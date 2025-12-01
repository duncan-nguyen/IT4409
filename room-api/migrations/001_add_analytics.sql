-- Migration: Add analytics and reporting capabilities
-- Version: 1.1.0
-- Date: 2025-11-03

-- Create room_analytics table for tracking room usage
CREATE TABLE IF NOT EXISTS room_analytics (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(255) NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    total_participants INTEGER DEFAULT 0,
    total_duration_minutes INTEGER DEFAULT 0,
    peak_participants INTEGER DEFAULT 0,
    average_session_duration_minutes DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, date)
);

-- Create user_activity table for user engagement metrics
CREATE TABLE IF NOT EXISTS user_activity (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    total_rooms_joined INTEGER DEFAULT 0,
    total_duration_minutes INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Create system_metrics table for overall platform health
CREATE TABLE IF NOT EXISTS system_metrics (
    id SERIAL PRIMARY KEY,
    metric_date TIMESTAMP NOT NULL,
    concurrent_rooms INTEGER DEFAULT 0,
    concurrent_users INTEGER DEFAULT 0,
    total_bandwidth_mb DECIMAL(15, 2) DEFAULT 0,
    average_latency_ms DECIMAL(10, 2) DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for analytics tables
CREATE INDEX IF NOT EXISTS idx_room_analytics_room_date ON room_analytics(room_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_room_analytics_date ON room_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_date ON user_activity(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_date ON user_activity(date DESC);
CREATE INDEX IF NOT EXISTS idx_system_metrics_date ON system_metrics(metric_date DESC);

-- Triggers for analytics tables
CREATE TRIGGER update_room_analytics_updated_at BEFORE UPDATE ON room_analytics
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_activity_updated_at BEFORE UPDATE ON user_activity
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to aggregate daily room analytics
CREATE OR REPLACE FUNCTION aggregate_room_analytics(target_date DATE)
RETURNS void AS $$
BEGIN
    INSERT INTO room_analytics (
        room_id, 
        date, 
        total_sessions, 
        total_participants,
        total_duration_minutes,
        peak_participants,
        average_session_duration_minutes
    )
    SELECT 
        rs.room_id,
        target_date,
        COUNT(DISTINCT rs.session_id) as total_sessions,
        COUNT(DISTINCT rs.user_id) as total_participants,
        COALESCE(SUM(rs.duration_seconds) / 60, 0) as total_duration_minutes,
        (SELECT MAX(participants) 
         FROM rooms r 
         WHERE r.room_id = rs.room_id 
         AND DATE(r.updated_at) = target_date) as peak_participants,
        COALESCE(AVG(rs.duration_seconds) / 60, 0) as average_session_duration_minutes
    FROM room_sessions rs
    WHERE DATE(rs.joined_at) = target_date
    GROUP BY rs.room_id
    ON CONFLICT (room_id, date) 
    DO UPDATE SET
        total_sessions = EXCLUDED.total_sessions,
        total_participants = EXCLUDED.total_participants,
        total_duration_minutes = EXCLUDED.total_duration_minutes,
        peak_participants = EXCLUDED.peak_participants,
        average_session_duration_minutes = EXCLUDED.average_session_duration_minutes,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to aggregate daily user activity
CREATE OR REPLACE FUNCTION aggregate_user_activity(target_date DATE)
RETURNS void AS $$
BEGIN
    INSERT INTO user_activity (
        user_id,
        date,
        total_sessions,
        total_rooms_joined,
        total_duration_minutes,
        messages_sent
    )
    SELECT 
        rs.user_id,
        target_date,
        COUNT(DISTINCT rs.session_id) as total_sessions,
        COUNT(DISTINCT rs.room_id) as total_rooms_joined,
        COALESCE(SUM(rs.duration_seconds) / 60, 0) as total_duration_minutes,
        (SELECT COUNT(*) 
         FROM room_messages rm 
         WHERE rm.user_id = rs.user_id 
         AND DATE(rm.created_at) = target_date) as messages_sent
    FROM room_sessions rs
    WHERE DATE(rs.joined_at) = target_date AND rs.user_id IS NOT NULL
    GROUP BY rs.user_id
    ON CONFLICT (user_id, date)
    DO UPDATE SET
        total_sessions = EXCLUDED.total_sessions,
        total_rooms_joined = EXCLUDED.total_rooms_joined,
        total_duration_minutes = EXCLUDED.total_duration_minutes,
        messages_sent = EXCLUDED.messages_sent,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;
