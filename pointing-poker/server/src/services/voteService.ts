import { query } from '../config/database.js';
import type { Vote, ParticipantWithVote } from '../types/index.js';

export const voteService = {
  async submitVote(sessionId: string, participantId: string, value: string): Promise<Vote> {
    const result = await query(
      `INSERT INTO votes (session_id, participant_id, value)
       VALUES ($1, $2, $3)
       ON CONFLICT (session_id, participant_id)
       DO UPDATE SET value = $3, voted_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [sessionId, participantId, value]
    );
    return mapVote(result.rows[0]);
  },

  async clearVote(sessionId: string, participantId: string): Promise<void> {
    await query(
      'DELETE FROM votes WHERE session_id = $1 AND participant_id = $2',
      [sessionId, participantId]
    );
  },

  async getVotes(sessionId: string): Promise<Vote[]> {
    const result = await query(
      'SELECT * FROM votes WHERE session_id = $1',
      [sessionId]
    );
    return result.rows.map(mapVote);
  },

  async getParticipantsWithVotes(roomId: string, sessionId: string): Promise<ParticipantWithVote[]> {
    const result = await query(
      `SELECT p.*, v.value as vote_value, v.id as vote_id
       FROM participants p
       LEFT JOIN votes v ON p.id = v.participant_id AND v.session_id = $2
       WHERE p.room_id = $1
       ORDER BY p.joined_at`,
      [roomId, sessionId]
    );
    return result.rows.map((row) => ({
      id: row.id as string,
      roomId: row.room_id as string,
      name: row.name as string,
      isModerator: row.is_moderator as boolean,
      isSpectator: row.is_spectator as boolean,
      socketId: row.socket_id as string | undefined,
      isConnected: row.is_connected as boolean,
      joinedAt: row.joined_at as Date,
      lastSeenAt: row.last_seen_at as Date,
      hasVoted: row.vote_id !== null,
      voteValue: row.vote_value as string | undefined,
    }));
  },

  async resetVotes(sessionId: string): Promise<void> {
    await query('DELETE FROM votes WHERE session_id = $1', [sessionId]);
  },

  async hasEveryoneVoted(roomId: string, sessionId: string): Promise<boolean> {
    const result = await query(
      `SELECT
        (SELECT COUNT(*) FROM participants WHERE room_id = $1 AND is_spectator = false AND is_connected = true) as total,
        (SELECT COUNT(*) FROM votes WHERE session_id = $2) as voted`,
      [roomId, sessionId]
    );
    const { total, voted } = result.rows[0];
    return parseInt(total) > 0 && parseInt(total) === parseInt(voted);
  },
};

function mapVote(row: Record<string, unknown>): Vote {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    participantId: row.participant_id as string,
    value: row.value as string,
    votedAt: row.voted_at as Date,
  };
}
