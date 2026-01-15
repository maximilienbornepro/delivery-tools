import { useRoom } from '../../context/RoomContext';
import { FIBONACCI_VALUES } from '../../types';
import styles from './VotingArea.module.css';

export function VotingArea() {
  const { selectedVote, submitVote, clearVote, currentParticipant } = useRoom();

  if (currentParticipant?.isSpectator) {
    return (
      <div className={styles.spectator}>
        <p>Vous êtes en mode spectateur</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Choisissez votre estimation</h2>
      <div className={styles.cards}>
        {FIBONACCI_VALUES.map((value) => (
          <button
            key={value}
            className={`${styles.card} ${selectedVote === value ? styles.selected : ''}`}
            onClick={() => (selectedVote === value ? clearVote() : submitVote(value))}
          >
            <span className={styles.value}>{value}</span>
          </button>
        ))}
      </div>
      {selectedVote && (
        <p className={styles.selectedInfo}>
          Vous avez sélectionné : <strong>{selectedVote}</strong>
        </p>
      )}
    </div>
  );
}
