import { useRoom } from '../../context/RoomContext';
import { FIBONACCI_VALUES } from '../../types';
import styles from './VoteResults.module.css';

export function VoteResults() {
  const { participants } = useRoom();

  const votes = participants
    .filter((p) => p.voteValue && !p.isSpectator)
    .map((p) => p.voteValue!);

  const numericVotes = votes
    .filter((v) => v !== '?')
    .map((v) => parseInt(v, 10));

  const average =
    numericVotes.length > 0
      ? (numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length).toFixed(1)
      : '-';

  // Count votes by value
  const voteCounts: Record<string, number> = {};
  for (const value of FIBONACCI_VALUES) {
    voteCounts[value] = votes.filter((v) => v === value).length;
  }

  // Find consensus (most common vote)
  const maxCount = Math.max(...Object.values(voteCounts));
  const consensus =
    maxCount > 0
      ? Object.entries(voteCounts)
          .filter(([, count]) => count === maxCount)
          .map(([value]) => value)
      : [];

  const hasConsensus = consensus.length === 1 && maxCount > 1;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Résultats</h2>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Moyenne</span>
          <span className={styles.statValue}>{average}</span>
        </div>
        {hasConsensus && (
          <div className={styles.stat}>
            <span className={styles.statLabel}>Consensus</span>
            <span className={`${styles.statValue} ${styles.consensus}`}>
              {consensus[0]}
            </span>
          </div>
        )}
      </div>

      <div className={styles.distribution}>
        <h3 className={styles.distributionTitle}>Distribution des votes</h3>
        <div className={styles.bars}>
          {FIBONACCI_VALUES.map((value) => {
            const count = voteCounts[value];
            const percentage = votes.length > 0 ? (count / votes.length) * 100 : 0;

            return (
              <div key={value} className={styles.barContainer}>
                <div className={styles.barWrapper}>
                  <div
                    className={styles.bar}
                    style={{ height: `${percentage}%` }}
                  />
                </div>
                <span className={styles.barLabel}>{value}</span>
                {count > 0 && <span className={styles.barCount}>{count}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
