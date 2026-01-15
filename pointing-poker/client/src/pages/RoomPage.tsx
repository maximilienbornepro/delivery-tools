import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useRoom } from '../context/RoomContext';
import { api } from '../services/api';
import { VotingArea } from '../components/room/VotingArea';
import { ParticipantsList } from '../components/room/ParticipantsList';
import { ActionBar } from '../components/room/ActionBar';
import { VoteResults } from '../components/room/VoteResults';
import { JiraPanel } from '../components/room/JiraPanel';
import { CurrentTicket } from '../components/room/CurrentTicket';
import { JoinRoomForm } from '../components/room/JoinRoomForm';
import { NotificationContainer } from '../components/common/Notification';
import styles from './RoomPage.module.css';

export function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const {
    room,
    session,
    currentParticipant,
    notifications,
    kickedInfo,
    setRoom,
    setSession,
    setCurrentParticipant,
    removeNotification,
    clearKickedInfo,
  } = useRoom();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [needsJoin, setNeedsJoin] = useState(false);
  const [joining, setJoining] = useState(false);
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    const participantId = localStorage.getItem('participantId');
    const participantName = localStorage.getItem('participantName');

    const loadRoom = async () => {
      try {
        const data = await api.getRoom(code!);
        setRoom(data.room);
        setSession(data.session);

        if (!participantId || !participantName) {
          // User needs to join - show join form
          setNeedsJoin(true);
          setLoading(false);
          return;
        }

        // Don't set participants here - let socket room:joined handle it to avoid flickering
        const participant = data.participants.find(
          (p: { id: string }) => p.id === participantId
        );

        if (participant) {
          setCurrentParticipant({ ...participant, hasVoted: false });
        } else {
          // Re-join if participant not found
          const joinData = await api.joinRoom(code!, participantName);
          localStorage.setItem('participantId', joinData.participant.id);
          setCurrentParticipant({ ...joinData.participant, hasVoted: false });
        }
      } catch {
        setError('Room introuvable');
      } finally {
        setLoading(false);
      }
    };

    loadRoom();
  }, [code, navigate, setRoom, setSession, setCurrentParticipant]);

  const handleJoin = async (name: string) => {
    setJoining(true);
    try {
      const joinData = await api.joinRoom(code!, name);
      localStorage.setItem('participantId', joinData.participant.id);
      localStorage.setItem('participantName', name);
      setCurrentParticipant({ ...joinData.participant, hasVoted: false });
      setNeedsJoin(false);
    } catch {
      setError('Impossible de rejoindre la room');
    } finally {
      setJoining(false);
    }
  };

  useEffect(() => {
    if (!socket || !isConnected || !room || !currentParticipant) return;
    if (hasJoinedRef.current) return;

    hasJoinedRef.current = true;
    socket.emit('room:join', {
      roomCode: room.code,
      participantId: currentParticipant.id,
    });
    // room:joined event in RoomContext will update participants with correct connected status
  }, [socket, isConnected, room, currentParticipant]);

  // Handle kicked participant - redirect to home
  useEffect(() => {
    if (kickedInfo) {
      alert(kickedInfo.message);
      localStorage.removeItem('participantId');
      clearKickedInfo();
      navigate('/');
    }
  }, [kickedInfo, clearKickedInfo, navigate]);

  const copyLink = () => {
    const link = `${window.location.origin}/room/${room?.code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h2>Erreur</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Retour à l'accueil</button>
      </div>
    );
  }

  if (needsJoin) {
    return (
      <JoinRoomForm
        roomName={room?.name || 'Room'}
        onJoin={handleJoin}
        loading={joining}
      />
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <img src="/francetv-logo.svg" alt="France.tv" className={styles.logo} />
        <div className={styles.roomInfo}>
          <h1 className={styles.roomName}>{room?.name}</h1>
          <div className={styles.roomCode}>
            <span>Code: {room?.code}</span>
            <button onClick={copyLink} className={styles.copyButton}>
              {copied ? 'Copié !' : 'Copier le lien'}
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <aside className={styles.sidebar}>
          <ParticipantsList />
        </aside>

        <section className={styles.content}>
          <CurrentTicket />
          {session?.status === 'voting' && <VotingArea />}
          {session?.status === 'revealed' && <VoteResults />}
          {session?.status === 'finalized' && (
            <div className={styles.finalized}>
              <h2>Session terminée</h2>
              <div className={styles.finalResults}>
                <div className={styles.finalItem}>
                  <span className={styles.finalLabel}>Points</span>
                  <span className={styles.finalValue}>{session.finalEstimate}</span>
                </div>
                <div className={styles.finalItem}>
                  <span className={styles.finalLabel}>Temps estimé</span>
                  <span className={styles.finalValue}>{session.timeEstimate}</span>
                </div>
              </div>
              {session.syncedToJira && (
                <p className={styles.syncStatus}>Synchronisé avec JIRA</p>
              )}
            </div>
          )}

          {currentParticipant?.isModerator && (
            <>
              <ActionBar />
              <JiraPanel />
            </>
          )}
        </section>
      </main>

      <NotificationContainer
        notifications={notifications}
        onClose={removeNotification}
      />
    </div>
  );
}
