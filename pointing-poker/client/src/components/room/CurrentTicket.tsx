import { useState, useEffect } from 'react';
import { useRoom } from '../../context/RoomContext';
import { api } from '../../services/api';
import styles from './CurrentTicket.module.css';

export function CurrentTicket() {
  const { session } = useRoom();
  const [jiraBaseUrl, setJiraBaseUrl] = useState<string | null>(null);

  useEffect(() => {
    api.getConfig().then((config) => {
      setJiraBaseUrl(config.jiraBaseUrl);
    });
  }, []);

  if (!session?.jiraTicketKey) {
    return (
      <div className={styles.container}>
        <div className={styles.noTicket}>
          Aucun ticket selectionne
        </div>
      </div>
    );
  }

  const project = session.jiraTicketKey.split('-')[0];
  const ticketUrl = jiraBaseUrl ? `${jiraBaseUrl}/browse/${session.jiraTicketKey}` : null;

  return (
    <div className={styles.container}>
      <div className={styles.ticketInfo}>
        <div className={styles.ticketHeader}>
          <span className={styles.ticketProject}>{project}</span>
          {ticketUrl ? (
            <a
              href={ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ticketLink}
            >
              {session.jiraTicketKey}
              <span className={styles.linkIcon}>↗</span>
            </a>
          ) : (
            <span className={styles.ticketKey}>{session.jiraTicketKey}</span>
          )}
        </div>
        {session.jiraTicketSummary && (
          <p className={styles.ticketSummary}>{session.jiraTicketSummary}</p>
        )}
      </div>
    </div>
  );
}
