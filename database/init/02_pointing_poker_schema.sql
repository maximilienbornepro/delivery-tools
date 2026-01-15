-- Connect to pointing_poker database
\c pointing_poker;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create rooms table
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(8) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    jira_base_url VARCHAR(500),
    jira_email VARCHAR(255),
    jira_api_token TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rooms_code ON rooms(code);
CREATE INDEX idx_rooms_active ON rooms(is_active);

-- Create participants table
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_moderator BOOLEAN DEFAULT false,
    is_spectator BOOLEAN DEFAULT false,
    socket_id VARCHAR(100),
    is_connected BOOLEAN DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_participants_room ON participants(room_id);
CREATE INDEX idx_participants_socket ON participants(socket_id);

-- Create session status enum
CREATE TYPE session_status AS ENUM ('voting', 'revealed', 'finalized');

-- Create sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    jira_ticket_key VARCHAR(50),
    jira_ticket_summary TEXT,
    status session_status DEFAULT 'voting',
    final_estimate VARCHAR(10),
    time_estimate VARCHAR(50),
    revealed_at TIMESTAMP WITH TIME ZONE,
    synced_to_jira BOOLEAN DEFAULT false,
    synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_room ON sessions(room_id);
CREATE INDEX idx_sessions_status ON sessions(status);

-- Create votes table
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    value VARCHAR(10) NOT NULL,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, participant_id)
);

CREATE INDEX idx_votes_session ON votes(session_id);
CREATE INDEX idx_votes_participant ON votes(participant_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
