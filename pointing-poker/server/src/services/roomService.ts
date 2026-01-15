import { query } from '../config/database.js';
import { generateRoomCode } from '../utils/generateRoomCode.js';
import type { Room, Participant, Session } from '../types/index.js';

export const roomService = {
  async createRoom(name: string, createdBy: string): Promise<Room> {
    const code = generateRoomCode();
    const result = await query(
      `INSERT INTO rooms (code, name, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [code, name, createdBy]
    );
    return mapRoom(result.rows[0]);
  },

  async getRoomByCode(code: string): Promise<Room | null> {
    const result = await query(
      'SELECT * FROM rooms WHERE code = $1 AND is_active = true',
      [code]
    );
    return result.rows[0] ? mapRoom(result.rows[0]) : null;
  },

  async joinRoom(roomId: string, name: string, isModerator = false): Promise<Participant> {
    const result = await query(
      `INSERT INTO participants (room_id, name, is_moderator)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [roomId, name, isModerator]
    );
    return mapParticipant(result.rows[0]);
  },

  async getParticipants(roomId: string): Promise<Participant[]> {
    const result = await query(
      'SELECT * FROM participants WHERE room_id = $1 ORDER BY joined_at',
      [roomId]
    );
    return result.rows.map(mapParticipant);
  },

  async updateParticipantSocket(participantId: string, socketId: string | null, isConnected: boolean): Promise<void> {
    await query(
      `UPDATE participants
       SET socket_id = $1, is_connected = $2, last_seen_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [socketId, isConnected, participantId]
    );
  },

  async getParticipantBySocket(socketId: string): Promise<Participant | null> {
    const result = await query(
      'SELECT * FROM participants WHERE socket_id = $1',
      [socketId]
    );
    return result.rows[0] ? mapParticipant(result.rows[0]) : null;
  },

  async createSession(roomId: string, jiraTicketKey?: string, jiraTicketSummary?: string): Promise<Session> {
    const result = await query(
      `INSERT INTO sessions (room_id, jira_ticket_key, jira_ticket_summary)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [roomId, jiraTicketKey || null, jiraTicketSummary || null]
    );
    return mapSession(result.rows[0]);
  },

  async getCurrentSession(roomId: string): Promise<Session | null> {
    const result = await query(
      `SELECT * FROM sessions
       WHERE room_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [roomId]
    );
    return result.rows[0] ? mapSession(result.rows[0]) : null;
  },

  async updateSessionStatus(sessionId: string, status: string): Promise<Session> {
    const revealedAt = status === 'revealed' ? 'CURRENT_TIMESTAMP' : 'revealed_at';
    const result = await query(
      `UPDATE sessions
       SET status = $1, revealed_at = ${status === 'revealed' ? 'CURRENT_TIMESTAMP' : 'revealed_at'}
       WHERE id = $2
       RETURNING *`,
      [status, sessionId]
    );
    return mapSession(result.rows[0]);
  },

  async finalizeSession(sessionId: string, finalEstimate: string, timeEstimate: string): Promise<Session> {
    const result = await query(
      `UPDATE sessions
       SET status = 'finalized', final_estimate = $1, time_estimate = $2
       WHERE id = $3
       RETURNING *`,
      [finalEstimate, timeEstimate, sessionId]
    );
    return mapSession(result.rows[0]);
  },

  async updateJiraConfig(roomId: string, baseUrl: string, email: string, apiToken: string): Promise<void> {
    await query(
      `UPDATE rooms
       SET jira_base_url = $1, jira_email = $2, jira_api_token = $3
       WHERE id = $4`,
      [baseUrl, email, apiToken, roomId]
    );
  },

  async markSessionSynced(sessionId: string): Promise<void> {
    await query(
      `UPDATE sessions
       SET synced_to_jira = true, synced_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [sessionId]
    );
  },
};

function mapRoom(row: Record<string, unknown>): Room {
  return {
    id: row.id as string,
    code: row.code as string,
    name: row.name as string,
    createdBy: row.created_by as string,
    jiraBaseUrl: row.jira_base_url as string | undefined,
    jiraEmail: row.jira_email as string | undefined,
    jiraApiToken: row.jira_api_token as string | undefined,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  };
}

function mapParticipant(row: Record<string, unknown>): Participant {
  return {
    id: row.id as string,
    roomId: row.room_id as string,
    name: row.name as string,
    isModerator: row.is_moderator as boolean,
    isSpectator: row.is_spectator as boolean,
    socketId: row.socket_id as string | undefined,
    isConnected: row.is_connected as boolean,
    joinedAt: row.joined_at as Date,
    lastSeenAt: row.last_seen_at as Date,
  };
}

function mapSession(row: Record<string, unknown>): Session {
  return {
    id: row.id as string,
    roomId: row.room_id as string,
    jiraTicketKey: row.jira_ticket_key as string | undefined,
    jiraTicketSummary: row.jira_ticket_summary as string | undefined,
    status: row.status as Session['status'],
    finalEstimate: row.final_estimate as string | undefined,
    timeEstimate: row.time_estimate as string | undefined,
    revealedAt: row.revealed_at as Date | undefined,
    syncedToJira: row.synced_to_jira as boolean,
    syncedAt: row.synced_at as Date | undefined,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  };
}
