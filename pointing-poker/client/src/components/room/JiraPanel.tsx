import { useState, useEffect, useRef } from 'react';
import { useRoom } from '../../context/RoomContext';
import { api } from '../../services/api';
import { FIBONACCI_VALUES } from '../../types';
import styles from './JiraPanel.module.css';

interface JiraTicket {
  key: string;
  summary: string;
}

export function JiraPanel() {
  const { session, finalizeSession, markTicketNeedsRework, newSession, shouldRefreshTickets, clearRefreshTickets } = useRoom();
  const [finalEstimate, setFinalEstimate] = useState('');
  const [timeEstimate, setTimeEstimate] = useState('');
  const [reworkComment, setReworkComment] = useState('');
  const [reworkTicket, setReworkTicket] = useState<JiraTicket | null>(null);
  const [jiraConfigured, setJiraConfigured] = useState(false);
  const [jiraBaseUrl, setJiraBaseUrl] = useState<string | null>(null);
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    api.getConfig().then((config) => {
      setJiraConfigured(config.jiraConfigured);
      setJiraBaseUrl(config.jiraBaseUrl || null);
      if (config.jiraConfigured) {
        loadRefinementTickets();
      }
    });
  }, []);

  // Reset form when session changes (new ticket selected)
  useEffect(() => {
    setFinalEstimate('');
    setTimeEstimate('');
    setReworkComment('');
  }, [session?.id]);

  // Auto-refresh tickets when JIRA sync is successful
  useEffect(() => {
    if (shouldRefreshTickets) {
      // Immediately remove the current ticket from the list for instant feedback
      if (session?.jiraTicketKey) {
        setTickets(prev => prev.filter(t => t.key !== session.jiraTicketKey));
      }
      // Also refresh from server after delay to sync with JIRA
      setTimeout(() => {
        loadRefinementTickets();
      }, 3000);
      clearRefreshTickets();
    }
  }, [shouldRefreshTickets, clearRefreshTickets, session?.jiraTicketKey]);

  const loadRefinementTickets = async () => {
    setLoadingTickets(true);
    try {
      const result = await api.searchJiraTickets();
      setTickets(result.tickets);
      // Auto-select first ticket if none selected and not in finalized state
      if (result.tickets.length > 0 && !session?.jiraTicketKey && session?.status !== 'finalized') {
        const firstTicket = result.tickets[0];
        handleSelectTicket(firstTicket.key, firstTicket.summary);
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleFinalize = () => {
    if (!finalEstimate) return;
    finalizeSession(finalEstimate, timeEstimate, jiraConfigured && !!session?.jiraTicketKey);
  };

  const handleMarkNeedsRework = () => {
    if (!reworkTicket) return;
    markTicketNeedsRework(reworkTicket.key, reworkComment);
    setReworkComment('');
    setReworkTicket(null);
    // Remove the ticket from the list immediately
    setTickets(prev => prev.filter(t => t.key !== reworkTicket.key));
  };

  const openReworkModal = (e: React.MouseEvent, ticket: JiraTicket) => {
    e.stopPropagation();
    setReworkTicket(ticket);
    setReworkComment('');
  };

  const closeReworkModal = () => {
    setReworkTicket(null);
    setReworkComment('');
  };

  const handleSelectTicket = (ticketKey: string, ticketSummary?: string) => {
    const summary = ticketSummary || tickets.find(t => t.key === ticketKey)?.summary;
    newSession(ticketKey, summary);
  };

  // Show ticket selector when voting or after finalized (to select next ticket)
  if (session?.status === 'voting' || session?.status === 'finalized') {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Tickets JIRA - Refinement</h3>

        {session?.status === 'finalized' && (
          <p className={styles.successMessage}>
            Ticket {session.jiraTicketKey} estimé - Sélectionnez le prochain ticket
          </p>
        )}

        {loadingTickets ? (
          <p className={styles.loading}>Chargement des tickets...</p>
        ) : tickets.length > 0 ? (
          <div className={styles.ticketList}>
            {tickets.map((ticket) => {
              const project = ticket.key.split('-')[0];
              return (
                <div key={ticket.key} className={styles.ticketRow}>
                  <button
                    className={`${styles.ticketItem} ${
                      session?.jiraTicketKey === ticket.key && session?.status === 'voting' ? styles.active : ''
                    }`}
                    onClick={() => handleSelectTicket(ticket.key)}
                  >
                    <div className={styles.ticketHeader}>
                      <span className={styles.ticketProject}>{project}</span>
                      <span className={styles.ticketKey}>{ticket.key}</span>
                    </div>
                    <span className={styles.ticketSummary}>{ticket.summary}</span>
                  </button>
                  <button
                    className={styles.notReadyButton}
                    onClick={(e) => openReworkModal(e, ticket)}
                    title="Marquer comme a retravailler"
                  >
                    Pas pret ?
                  </button>
                </div>
              );
            })}
          </div>
        ) : jiraConfigured ? (
          <p className={styles.noTickets}>Aucun ticket dans les sprints de refinement</p>
        ) : (
          <p className={styles.noTickets}>JIRA non configuré</p>
        )}

        {jiraConfigured && (
          <button onClick={loadRefinementTickets} className={styles.refreshButton} disabled={loadingTickets}>
            Rafraîchir les tickets
          </button>
        )}

        {reworkTicket && (
          <div className={styles.modalOverlay} onClick={closeReworkModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3 className={styles.modalTitle}>Le ticket n'est pas encore pret ?</h3>
              <p className={styles.modalTicket}>
                <span className={styles.ticketKey}>{reworkTicket.key}</span>
                <span className={styles.modalTicketSummary}>{reworkTicket.summary}</span>
              </p>
              <textarea
                placeholder="Commentaire expliquant pourquoi le ticket doit etre retravaille..."
                value={reworkComment}
                onChange={(e) => setReworkComment(e.target.value)}
                className={styles.reworkTextarea}
                rows={4}
                autoFocus
              />
              <div className={styles.modalActions}>
                <button onClick={closeReworkModal} className={styles.cancelButton}>
                  Annuler
                </button>
                <button onClick={handleMarkNeedsRework} className={styles.reworkButton}>
                  Marquer a retravailler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (session?.status !== 'revealed') {
    return null;
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Finaliser l'estimation</h3>

      {session?.jiraTicketKey && (
        <div className={styles.currentTicket}>
          Ticket:{' '}
          {jiraBaseUrl ? (
            <a
              href={`${jiraBaseUrl}/browse/${session.jiraTicketKey}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ticketLink}
            >
              {session.jiraTicketKey}
            </a>
          ) : (
            <strong>{session.jiraTicketKey}</strong>
          )}
        </div>
      )}

      <div className={styles.estimateForm}>
        <div className={styles.field}>
          <label className={styles.label}>Points (Story Points)</label>
          <div className={styles.pointsGrid}>
            {FIBONACCI_VALUES.filter((v) => v !== '?').map((value) => (
              <button
                key={value}
                type="button"
                className={`${styles.pointButton} ${
                  finalEstimate === value ? styles.selected : ''
                }`}
                onClick={() => setFinalEstimate(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Temps estimé (optionnel)</label>
          <input
            type="text"
            placeholder="ex: 2d, 4h, 1d 2h"
            value={timeEstimate}
            onChange={(e) => setTimeEstimate(e.target.value)}
            className={styles.input}
          />
        </div>

        <button
          onClick={handleFinalize}
          className={styles.finalizeButton}
          disabled={!finalEstimate}
        >
          {jiraConfigured && session?.jiraTicketKey
            ? 'Valider et synchroniser JIRA'
            : "Valider l'estimation"}
        </button>
      </div>
    </div>
  );
}
