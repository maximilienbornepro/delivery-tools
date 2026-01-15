export interface Room {
  id: string;
  code: string;
  name: string;
  createdBy: string;
  jiraBaseUrl?: string;
  jiraEmail?: string;
  jiraApiToken?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Room type for client responses (excludes sensitive fields)
export type RoomPublic = Omit<Room, 'jiraApiToken' | 'jiraEmail'>;

export function toPublicRoom(room: Room): RoomPublic {
  const { jiraApiToken, jiraEmail, ...publicRoom } = room;
  return publicRoom;
}

export interface Participant {
  id: string;
  roomId: string;
  name: string;
  isModerator: boolean;
  isSpectator: boolean;
  socketId?: string;
  isConnected: boolean;
  joinedAt: Date;
  lastSeenAt: Date;
}

export type SessionStatus = 'voting' | 'revealed' | 'finalized';

export interface Session {
  id: string;
  roomId: string;
  jiraTicketKey?: string;
  jiraTicketSummary?: string;
  status: SessionStatus;
  finalEstimate?: string;
  timeEstimate?: string;
  revealedAt?: Date;
  syncedToJira: boolean;
  syncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vote {
  id: string;
  sessionId: string;
  participantId: string;
  value: string;
  votedAt: Date;
}

export interface ParticipantWithVote extends Participant {
  hasVoted: boolean;
  voteValue?: string;
}

export const FIBONACCI_VALUES = ['0', '1', '2', '3', '5', '8', '13', '21', '34', '?'] as const;
export type FibonacciValue = typeof FIBONACCI_VALUES[number];
