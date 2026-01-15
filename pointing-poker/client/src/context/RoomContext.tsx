import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useSocket } from './SocketContext';
import type { Room, Session, ParticipantWithVote } from '../types';
import type { NotificationData } from '../components/common/Notification';

interface KickedInfo {
  kickedBy: string;
  message: string;
}

interface RoomContextType {
  room: Room | null;
  session: Session | null;
  participants: ParticipantWithVote[];
  currentParticipant: ParticipantWithVote | null;
  selectedVote: string | null;
  notifications: NotificationData[];
  kickedInfo: KickedInfo | null;
  shouldRefreshTickets: boolean;
  setRoom: (room: Room | null) => void;
  setSession: (session: Session | null) => void;
  setParticipants: React.Dispatch<React.SetStateAction<ParticipantWithVote[]>>;
  setCurrentParticipant: (participant: ParticipantWithVote | null) => void;
  submitVote: (value: string) => void;
  clearVote: () => void;
  revealVotes: () => void;
  resetVotes: () => void;
  newSession: (jiraTicketKey?: string, jiraTicketSummary?: string) => void;
  finalizeSession: (finalEstimate: string, timeEstimate: string, syncToJira: boolean) => void;
  markTicketNeedsRework: (ticketKey: string, comment: string) => void;
  removeNotification: (id: string) => void;
  kickParticipant: (participantId: string) => void;
  clearKickedInfo: () => void;
  clearRefreshTickets: () => void;
}

const RoomContext = createContext<RoomContextType | null>(null);

export function RoomProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();
  const [room, setRoom] = useState<Room | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<ParticipantWithVote[]>([]);
  const [currentParticipant, setCurrentParticipant] = useState<ParticipantWithVote | null>(null);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [kickedInfo, setKickedInfo] = useState<KickedInfo | null>(null);
  const [shouldRefreshTickets, setShouldRefreshTickets] = useState(false);

  const addNotification = useCallback((notification: Omit<NotificationData, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setNotifications((prev) => [...prev, { ...notification, id }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearKickedInfo = useCallback(() => {
    setKickedInfo(null);
  }, []);

  const clearRefreshTickets = useCallback(() => {
    setShouldRefreshTickets(false);
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('room:joined', (data) => {
      setRoom(data.room);
      setSession(data.currentSession);
      setParticipants(data.participants);
    });

    socket.on('room:participant_joined', (data) => {
      setParticipants((prev) => {
        // Avoid duplicates
        if (prev.some((p) => p.id === data.participant.id)) {
          return prev.map((p) =>
            p.id === data.participant.id ? { ...data.participant, hasVoted: false } : p
          );
        }
        return [...prev, { ...data.participant, hasVoted: false }];
      });
    });

    socket.on('room:participant_left', (data) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === data.participantId ? { ...p, isConnected: false } : p
        )
      );
    });

    socket.on('vote:submitted', (data) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === data.participantId ? { ...p, hasVoted: true } : p
        )
      );
    });

    socket.on('vote:cleared', (data) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === data.participantId ? { ...p, hasVoted: false, voteValue: undefined } : p
        )
      );
    });

    socket.on('session:votes_revealed', (data) => {
      setSession((prev) => prev ? { ...prev, status: 'revealed' } : null);
      setParticipants(data.participants);
    });

    socket.on('session:reset', () => {
      setSession((prev) => prev ? { ...prev, status: 'voting' } : null);
      setParticipants((prev) =>
        prev.map((p) => ({ ...p, hasVoted: false, voteValue: undefined }))
      );
      setSelectedVote(null);
    });

    socket.on('session:new', (data) => {
      setSession(data.session);
      setParticipants((prev) =>
        prev.map((p) => ({ ...p, hasVoted: false, voteValue: undefined }))
      );
      setSelectedVote(null);
    });

    socket.on('session:finalized', (data) => {
      setSession((prev) =>
        prev
          ? {
              ...prev,
              status: 'finalized',
              finalEstimate: data.finalEstimate,
              timeEstimate: data.timeEstimate,
              syncedToJira: data.jiraSynced,
            }
          : null
      );
    });

    socket.on('jira:sync_result', (data: { success: boolean; ticketKey: string; message: string; details?: string }) => {
      addNotification({
        type: data.success ? 'success' : 'error',
        message: data.message,
        details: data.details,
      });
      if (data.success) {
        setShouldRefreshTickets(true);
      }
    });

    socket.on('participant:kicked', (data: { kickedBy: string; message: string }) => {
      setKickedInfo(data);
    });

    socket.on('room:participant_removed', (data: { participantId: string }) => {
      setParticipants((prev) => prev.filter((p) => p.id !== data.participantId));
    });

    socket.on('ticket:marked_rework', () => {
      setShouldRefreshTickets(true);
    });

    return () => {
      socket.off('room:joined');
      socket.off('room:participant_joined');
      socket.off('room:participant_left');
      socket.off('vote:submitted');
      socket.off('vote:cleared');
      socket.off('session:votes_revealed');
      socket.off('session:reset');
      socket.off('session:new');
      socket.off('session:finalized');
      socket.off('jira:sync_result');
      socket.off('participant:kicked');
      socket.off('room:participant_removed');
      socket.off('ticket:marked_rework');
    };
  }, [socket, addNotification]);

  const submitVote = useCallback(
    (value: string) => {
      if (!socket || !session || !currentParticipant || !room) return;
      socket.emit('vote:submit', {
        sessionId: session.id,
        participantId: currentParticipant.id,
        value,
        roomCode: room.code,
        roomId: room.id,
      });
      setSelectedVote(value);
    },
    [socket, session, currentParticipant, room]
  );

  const clearVote = useCallback(() => {
    if (!socket || !session || !currentParticipant || !room) return;
    socket.emit('vote:clear', {
      sessionId: session.id,
      participantId: currentParticipant.id,
      roomCode: room.code,
    });
    setSelectedVote(null);
  }, [socket, session, currentParticipant, room]);

  const revealVotes = useCallback(() => {
    if (!socket || !session || !room) return;
    socket.emit('session:reveal', {
      sessionId: session.id,
      roomId: room.id,
      roomCode: room.code,
    });
  }, [socket, session, room]);

  const resetVotes = useCallback(() => {
    if (!socket || !session || !room) return;
    socket.emit('session:reset', {
      sessionId: session.id,
      roomId: room.id,
      roomCode: room.code,
    });
  }, [socket, session, room]);

  const newSession = useCallback(
    (jiraTicketKey?: string, jiraTicketSummary?: string) => {
      if (!socket || !room) return;
      socket.emit('session:new', {
        roomId: room.id,
        roomCode: room.code,
        jiraTicketKey,
        jiraTicketSummary,
      });
    },
    [socket, room]
  );

  const finalizeSession = useCallback(
    (finalEstimate: string, timeEstimate: string, syncToJira: boolean) => {
      if (!socket || !session || !room) return;
      socket.emit('session:finalize', {
        sessionId: session.id,
        roomCode: room.code,
        finalEstimate,
        timeEstimate,
        syncToJira,
      });
    },
    [socket, session, room]
  );

  const markTicketNeedsRework = useCallback(
    (ticketKey: string, comment: string) => {
      if (!socket || !room) return;
      socket.emit('ticket:needs_rework', {
        ticketKey,
        roomCode: room.code,
        comment,
      });
    },
    [socket, room]
  );

  const kickParticipant = useCallback(
    (participantId: string) => {
      if (!socket || !room || !currentParticipant) return;
      socket.emit('participant:kick', {
        participantId,
        roomCode: room.code,
        kickedBy: currentParticipant.name,
      });
    },
    [socket, room, currentParticipant]
  );

  return (
    <RoomContext.Provider
      value={{
        room,
        session,
        participants,
        currentParticipant,
        selectedVote,
        notifications,
        kickedInfo,
        shouldRefreshTickets,
        setRoom,
        setSession,
        setParticipants,
        setCurrentParticipant,
        submitVote,
        clearVote,
        revealVotes,
        resetVotes,
        newSession,
        finalizeSession,
        markTicketNeedsRework,
        removeNotification,
        kickParticipant,
        clearKickedInfo,
        clearRefreshTickets,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
}
