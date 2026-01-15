import { useRoom } from '../../context/RoomContext';
import styles from './ParticipantsList.module.css';

export function ParticipantsList() {
  const { participants, session, currentParticipant, kickParticipant } = useRoom();
  const isRevealed = session?.status === 'revealed' || session?.status === 'finalized';
  const isModerator = currentParticipant?.isModerator;

  const handleKick = (participantId: string) => {
    if (confirm('Voulez-vous vraiment retirer ce participant ?')) {
      kickParticipant(participantId);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        Participants ({participants.filter((p) => p.isConnected).length})
      </h3>
      <ul className={styles.list}>
        {participants.map((participant) => (
          <li
            key={participant.id}
            className={`${styles.item} ${
              participant.id === currentParticipant?.id ? styles.current : ''
            } ${!participant.isConnected ? styles.disconnected : ''}`}
          >
            <div className={styles.avatar}>
              {participant.name.charAt(0).toUpperCase()}
            </div>
            <div className={styles.info}>
              <span className={styles.name}>{participant.name}</span>
              {participant.isModerator && (
                <span className={styles.moderatorBadge}>Modérateur</span>
              )}
              {participant.isSpectator && (
                <span className={styles.spectatorBadge}>Spectateur</span>
              )}
              {!participant.isConnected && (
                <span className={styles.status}>Déconnecté</span>
              )}
            </div>
            <div className={styles.actions}>
              {isModerator && !participant.isConnected && participant.id !== currentParticipant?.id && (
                <button
                  className={styles.kickButton}
                  onClick={() => handleKick(participant.id)}
                  title="Retirer ce participant"
                >
                  ×
                </button>
              )}
              <div className={styles.vote}>
                {participant.isSpectator ? (
                  <span className={styles.spectatorIcon}>👁</span>
                ) : isRevealed && participant.voteValue ? (
                  <span className={styles.voteValue}>{participant.voteValue}</span>
                ) : participant.hasVoted ? (
                  <span className={styles.voted}>✓</span>
                ) : (
                  <span className={styles.waiting}>?</span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
