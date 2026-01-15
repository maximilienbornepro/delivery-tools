export interface Room {
  id: string;
  code: string;
  name: string;
  createdBy: string;
  jiraBaseUrl?: string;
  jiraEmail?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Participant {
  id: string;
  roomId: string;
  name: string;
  isModerator: boolean;
  isSpectator: boolean;
  isConnected: boolean;
}

export interface ParticipantWithVote extends Participant {
  hasVoted: boolean;
  voteValue?: string;
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
  syncedToJira: boolean;
  createdAt: string;
}

export interface Vote {
  id: string;
  sessionId: string;
  participantId: string;
  value: string;
}

export const FIBONACCI_VALUES = ['0', '1', '2', '3', '5', '8', '13', '21', '34', '?'] as const;
export type FibonacciValue = typeof FIBONACCI_VALUES[number];
