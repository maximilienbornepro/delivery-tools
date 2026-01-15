import { Server, Socket } from 'socket.io';
import { roomService } from '../services/roomService.js';
import { voteService } from '../services/voteService.js';
import { jiraService } from '../services/jiraService.js';
import { config } from '../config/env.js';
import { toPublicRoom } from '../types/index.js';

export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('room:join', async (data: { roomCode: string; participantId: string }) => {
      try {
        const { roomCode, participantId } = data;
        const room = await roomService.getRoomByCode(roomCode);

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        await roomService.updateParticipantSocket(participantId, socket.id, true);
        socket.join(roomCode);

        let participants = await roomService.getParticipants(room.id);

        // Handle duplicates: find participants with the same name
        const currentParticipant = participants.find(p => p.id === participantId);
        if (currentParticipant) {
          const duplicates = participants.filter(
            p => p.name === currentParticipant.name && p.id !== participantId && !p.isConnected
          );
          // Remove disconnected duplicates from the list (keep only the connected one)
          if (duplicates.length > 0) {
            const duplicateIds = duplicates.map(d => d.id);
            participants = participants.filter(p => !duplicateIds.includes(p.id));
            // Notify room about removed duplicates
            duplicateIds.forEach(dupId => {
              io.to(roomCode).emit('room:participant_removed', { participantId: dupId });
            });
          }
        }

        const session = await roomService.getCurrentSession(room.id);
        let participantsWithVotes = participants.map(p => ({ ...p, hasVoted: false }));

        if (session) {
          participantsWithVotes = await voteService.getParticipantsWithVotes(room.id, session.id);
          // Filter out duplicates from votes list too
          const participantIds = participants.map(p => p.id);
          participantsWithVotes = participantsWithVotes.filter(p => participantIds.includes(p.id));
          // Hide vote values if not revealed
          if (session.status === 'voting') {
            participantsWithVotes = participantsWithVotes.map(p => ({ ...p, voteValue: undefined }));
          }
        }

        socket.emit('room:joined', {
          room: toPublicRoom(room),
          participants: participantsWithVotes,
          currentSession: session,
        });

        socket.to(roomCode).emit('room:participant_joined', {
          participant: participants.find(p => p.id === participantId),
        });
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    socket.on('vote:submit', async (data: { sessionId: string; participantId: string; value: string; roomCode: string; roomId: string }) => {
      try {
        const { sessionId, participantId, value, roomCode, roomId } = data;
        await voteService.submitVote(sessionId, participantId, value);

        if (roomCode) {
          io.to(roomCode).emit('vote:submitted', {
            participantId,
            hasVoted: true,
          });

          // Check if everyone has voted
          const allVoted = await voteService.hasEveryoneVoted(roomId, sessionId);
          if (allVoted) {
            io.to(roomCode).emit('vote:all_submitted');
          }
        }
      } catch (error) {
        console.error('Error submitting vote:', error);
        socket.emit('error', { message: 'Failed to submit vote' });
      }
    });

    socket.on('vote:clear', async (data: { sessionId: string; participantId: string; roomCode: string }) => {
      try {
        const { sessionId, participantId, roomCode } = data;
        await voteService.clearVote(sessionId, participantId);

        if (roomCode) {
          io.to(roomCode).emit('vote:cleared', { participantId });
        }
      } catch (error) {
        console.error('Error clearing vote:', error);
        socket.emit('error', { message: 'Failed to clear vote' });
      }
    });

    socket.on('session:reveal', async (data: { sessionId: string; roomId: string; roomCode: string }) => {
      try {
        const { sessionId, roomId, roomCode } = data;
        await roomService.updateSessionStatus(sessionId, 'revealed');

        const votes = await voteService.getVotes(sessionId);
        const participantsWithVotes = await voteService.getParticipantsWithVotes(roomId, sessionId);

        if (roomCode) {
          io.to(roomCode).emit('session:votes_revealed', {
            votes,
            participants: participantsWithVotes,
          });
        }
      } catch (error) {
        console.error('Error revealing votes:', error);
        socket.emit('error', { message: 'Failed to reveal votes' });
      }
    });

    socket.on('session:reset', async (data: { sessionId: string; roomId: string; roomCode: string }) => {
      try {
        const { sessionId, roomCode } = data;
        await voteService.resetVotes(sessionId);
        await roomService.updateSessionStatus(sessionId, 'voting');

        if (roomCode) {
          io.to(roomCode).emit('session:reset', { sessionId });
        }
      } catch (error) {
        console.error('Error resetting session:', error);
        socket.emit('error', { message: 'Failed to reset session' });
      }
    });

    socket.on('session:new', async (data: { roomId: string; roomCode: string; jiraTicketKey?: string; jiraTicketSummary?: string }) => {
      try {
        const { roomCode, jiraTicketKey, jiraTicketSummary, roomId } = data;
        const session = await roomService.createSession(roomId, jiraTicketKey, jiraTicketSummary);

        if (roomCode) {
          io.to(roomCode).emit('session:new', { session });
        }
      } catch (error) {
        console.error('Error creating session:', error);
        socket.emit('error', { message: 'Failed to create session' });
      }
    });

    socket.on('session:finalize', async (data: {
      sessionId: string;
      roomCode: string;
      finalEstimate: string;
      timeEstimate: string;
      syncToJira: boolean;
    }) => {
      try {
        const { sessionId, roomCode, finalEstimate, timeEstimate, syncToJira } = data;
        const session = await roomService.finalizeSession(sessionId, finalEstimate, timeEstimate);

        if (!roomCode) {
          console.error('No roomCode provided for finalize');
          return;
        }

        const room = await roomService.getRoomByCode(roomCode);
        if (!room) {
          console.error('Room not found:', roomCode);
          return;
        }

        let jiraSynced = false;
        let jiraError: string | null = null;

        // Use room config or fall back to global config
        const jiraConfig = {
          baseUrl: room.jiraBaseUrl || config.jira.baseUrl,
          email: room.jiraEmail || config.jira.email,
          apiToken: room.jiraApiToken || config.jira.apiToken,
        };

        if (syncToJira && jiraConfig.baseUrl && jiraConfig.email && jiraConfig.apiToken && session.jiraTicketKey) {
          try {
            await jiraService.updateEstimate(
              jiraConfig,
              session.jiraTicketKey,
              parseInt(finalEstimate) || 0,
              timeEstimate || undefined
            );
            await roomService.markSessionSynced(sessionId);
            jiraSynced = true;
          } catch (err) {
            console.error('JIRA sync error:', err);
            jiraError = err instanceof Error ? err.message : 'Erreur inconnue';
          }
        }

        // If JIRA sync was successful, try to move the ticket to "A planifier" sprint
        let sprintMoveSuccess = false;
        let sprintMoveError: string | null = null;
        if (jiraSynced && session.jiraTicketKey) {
          const projectKey = session.jiraTicketKey.split('-')[0];
          try {
            const aPlanifierSprint = await jiraService.findAPlanifierSprint(jiraConfig, projectKey);
            if (aPlanifierSprint) {
              await jiraService.moveTicketToSprint(jiraConfig, session.jiraTicketKey, aPlanifierSprint.id);
              sprintMoveSuccess = true;
            } else {
              sprintMoveError = `Le sprint "A planifier" n'existe pas pour le projet ${projectKey}`;
            }
          } catch (err) {
            console.error('Sprint move error:', err);
            sprintMoveError = err instanceof Error ? err.message : 'Erreur inconnue';
          }
        }

        // Emit finalized event to everyone
        io.to(roomCode).emit('session:finalized', {
          sessionId,
          finalEstimate,
          timeEstimate,
          jiraSynced,
          ticketKey: session.jiraTicketKey,
        });

        // Emit JIRA sync result
        if (syncToJira && session.jiraTicketKey) {
          if (jiraSynced) {
            // Build success message including sprint move status
            let successMessage = `Ticket ${session.jiraTicketKey} mis a jour avec succes`;
            if (sprintMoveSuccess) {
              successMessage += ` et deplace vers "A planifier"`;
            }

            // Success message to everyone
            io.to(roomCode).emit('jira:sync_result', {
              success: true,
              ticketKey: session.jiraTicketKey,
              message: successMessage,
            });

            // If sprint move failed, send additional warning
            if (sprintMoveError) {
              io.to(roomCode).emit('jira:sync_result', {
                success: false,
                ticketKey: session.jiraTicketKey,
                message: sprintMoveError,
              });
            }
          } else {
            // Detailed error to moderator
            socket.emit('jira:sync_result', {
              success: false,
              ticketKey: session.jiraTicketKey,
              message: `Echec de la mise a jour du ticket ${session.jiraTicketKey}`,
              details: jiraError,
            });
            // Generic error to others
            socket.to(roomCode).emit('jira:sync_result', {
              success: false,
              ticketKey: session.jiraTicketKey,
              message: `Echec de la synchronisation JIRA`,
            });
          }
        }
      } catch (error) {
        console.error('Error finalizing session:', error);
        socket.emit('error', { message: 'Failed to finalize session' });
      }
    });

    socket.on('ticket:needs_rework', async (data: { ticketKey: string; roomCode: string; comment: string }) => {
      try {
        const { ticketKey, roomCode, comment } = data;

        const room = await roomService.getRoomByCode(roomCode);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        const jiraConfig = {
          baseUrl: room.jiraBaseUrl || config.jira.baseUrl,
          email: room.jiraEmail || config.jira.email,
          apiToken: room.jiraApiToken || config.jira.apiToken,
        };

        if (!jiraConfig.baseUrl || !jiraConfig.email || !jiraConfig.apiToken) {
          socket.emit('jira:sync_result', {
            success: false,
            ticketKey,
            message: 'Configuration JIRA manquante',
          });
          return;
        }

        try {
          const result = await jiraService.markTicketNeedsRework(jiraConfig, ticketKey, comment);

          // Build success message
          let successMessage = `Ticket ${ticketKey} marque comme "a retravailler"`;
          if (result.sprintMoved) {
            successMessage += ` et deplace vers "Cadrage"`;
          }

          io.to(roomCode).emit('jira:sync_result', {
            success: true,
            ticketKey,
            message: successMessage,
          });

          // If sprint move failed, send additional warning
          if (result.sprintError) {
            io.to(roomCode).emit('jira:sync_result', {
              success: false,
              ticketKey,
              message: result.sprintError,
            });
          }

          // Trigger ticket list refresh
          io.to(roomCode).emit('ticket:marked_rework', { ticketKey });
        } catch (err) {
          console.error('Error marking ticket as needs rework:', err);
          socket.emit('jira:sync_result', {
            success: false,
            ticketKey,
            message: `Echec de la mise a jour du ticket ${ticketKey}`,
            details: err instanceof Error ? err.message : 'Erreur inconnue',
          });
        }
      } catch (error) {
        console.error('Error in ticket:needs_rework:', error);
        socket.emit('error', { message: 'Failed to mark ticket as needs rework' });
      }
    });

    socket.on('participant:kick', async (data: { participantId: string; roomCode: string; kickedBy: string }) => {
      try {
        const { participantId, roomCode, kickedBy } = data;

        // Get the participant to kick
        const participants = await roomService.getParticipants(
          (await roomService.getRoomByCode(roomCode))?.id || ''
        );
        const participantToKick = participants.find(p => p.id === participantId);

        if (!participantToKick) {
          socket.emit('error', { message: 'Participant not found' });
          return;
        }

        // Notify the kicked participant if they have a socket
        if (participantToKick.socketId) {
          io.to(participantToKick.socketId).emit('participant:kicked', {
            kickedBy,
            message: `Vous avez été retiré de la room par ${kickedBy}`,
          });
        }

        // Mark as disconnected (not deleting from DB as requested)
        await roomService.updateParticipantSocket(participantId, null, false);

        // Notify everyone else
        io.to(roomCode).emit('room:participant_removed', {
          participantId,
        });
      } catch (error) {
        console.error('Error kicking participant:', error);
        socket.emit('error', { message: 'Failed to kick participant' });
      }
    });

    socket.on('disconnect', async () => {
      console.log(`Client disconnected: ${socket.id}`);
      try {
        const participant = await roomService.getParticipantBySocket(socket.id);
        if (participant) {
          await roomService.updateParticipantSocket(participant.id, null, false);

          const room = await roomService.getRoomByCode(
            Array.from(socket.rooms).find(r => r !== socket.id) || ''
          );

          if (room) {
            io.to(room.code).emit('room:participant_left', {
              participantId: participant.id,
            });
          }
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });
  });
}
