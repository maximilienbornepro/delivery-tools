import type { Release } from '../types';
import styles from './ReleaseBoard.module.css';

interface ReleaseBoardProps {
  releases: Release[];
}

export function ReleaseBoard({ releases }: ReleaseBoardProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span>BOARD DE RELEASE</span>
      </div>
      <div className={styles.content}>
        <div className={styles.tableHeader}>
          <div className={styles.colVersion}>Date & Version</div>
          <div className={styles.colDetail}>Récits</div>
        </div>
        <div className={styles.releaseList}>
          {releases.map((release) => (
            <div key={release.id} className={styles.releaseRow}>
              <div className={styles.releaseIcon}>
                <div className={styles.rocketIcon}>🚀</div>
              </div>
              <div className={styles.releaseInfo}>
                <div className={styles.releaseDate}>
                  <strong>Date :</strong> {release.date}
                </div>
                <div className={styles.releaseVersion}>
                  <strong>Version :</strong> {release.version}
                </div>
              </div>
              <div className={styles.releaseDetails}>
                {release.issues && release.issues.length > 0 ? (
                  <ul className={styles.detailList}>
                    {release.issues.map((issue) => (
                      <li key={issue.key}>
                        <a
                          href={`https://francetv.atlassian.net/browse/${issue.key}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.issueLink}
                        >
                          {issue.key}
                        </a>
                        <span className={styles.issueSummary}>{issue.summary}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className={styles.noDetails}>Aucun récit</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
