import { useRoom } from '../../context/RoomContext';
import styles from './ActionBar.module.css';

export function ActionBar() {
  const { session, participants, revealVotes, resetVotes } = useRoom();

  const votedCount = participants.filter((p) => p.hasVoted && !p.isSpectator).length;
  const totalVoters = participants.filter((p) => !p.isSpectator && p.isConnected).length;
  const allVoted = votedCount === totalVoters && totalVoters > 0;

  return (
    <div className={styles.container}>
      <div className={styles.status}>
        <span className={styles.voteCount}>
          {votedCount} / {totalVoters} votes
        </span>
        {allVoted && session?.status === 'voting' && (
          <span className={styles.allVoted}>Tous ont voté !</span>
        )}
      </div>

      <div className={styles.actions}>
        {session?.status === 'voting' && (
          <button
            onClick={revealVotes}
            className={styles.revealButton}
            disabled={votedCount === 0}
          >
            Révéler les votes
          </button>
        )}

        {(session?.status === 'revealed' || session?.status === 'finalized') && (
          <button onClick={resetVotes} className={styles.resetButton}>
            Revoter
          </button>
        )}
      </div>
    </div>
  );
}
