import { Router, Request, Response } from 'express';
import { roomService } from '../services/roomService.js';
import { jiraService } from '../services/jiraService.js';
import { config } from '../config/env.js';
import { toPublicRoom } from '../types/index.js';

const router = Router();

// Check if JIRA is configured globally
router.get('/config', (_req: Request, res: Response) => {
  res.json({
    jiraConfigured: !!(config.jira.baseUrl && config.jira.email && config.jira.apiToken),
    jiraBaseUrl: config.jira.baseUrl || null,
  });
});

// Create a new room
router.post('/rooms', async (req: Request, res: Response) => {
  try {
    const { name, createdBy } = req.body;

    if (!name || !createdBy) {
      res.status(400).json({ error: 'Name and createdBy are required' });
      return;
    }

    const room = await roomService.createRoom(name, createdBy);
    const participant = await roomService.joinRoom(room.id, createdBy, true);
    const session = await roomService.createSession(room.id);

    res.status(201).json({
      room: toPublicRoom(room),
      participant,
      session,
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get room by code
router.get('/rooms/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const room = await roomService.getRoomByCode(code);

    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    const participants = await roomService.getParticipants(room.id);
    const session = await roomService.getCurrentSession(room.id);

    res.json({ room: toPublicRoom(room), participants, session });
  } catch (error) {
    console.error('Error getting room:', error);
    res.status(500).json({ error: 'Failed to get room' });
  }
});

// Join a room
router.post('/rooms/:code/join', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const { name } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const room = await roomService.getRoomByCode(code);
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    const participant = await roomService.joinRoom(room.id, name, false);
    const session = await roomService.getCurrentSession(room.id);

    res.json({ room: toPublicRoom(room), participant, session });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// Configure JIRA for a room
router.patch('/rooms/:code/jira', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const { baseUrl, email, apiToken } = req.body;

    if (!baseUrl || !email || !apiToken) {
      res.status(400).json({ error: 'baseUrl, email, and apiToken are required' });
      return;
    }

    const room = await roomService.getRoomByCode(code);
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    await roomService.updateJiraConfig(room.id, baseUrl, email, apiToken);
    res.json({ success: true });
  } catch (error) {
    console.error('Error configuring JIRA:', error);
    res.status(500).json({ error: 'Failed to configure JIRA' });
  }
});

// Debug: Get all fields from a specific ticket
router.get('/jira/ticket/:ticketKey/fields', async (req: Request, res: Response) => {
  try {
    const { ticketKey } = req.params;

    if (!config.jira.baseUrl || !config.jira.email || !config.jira.apiToken) {
      res.status(400).json({ error: 'JIRA not configured' });
      return;
    }

    const auth = Buffer.from(`${config.jira.email}:${config.jira.apiToken}`).toString('base64');

    const response = await fetch(
      `${config.jira.baseUrl}/rest/api/3/issue/${ticketKey}`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      res.status(response.status).json({ error: 'Failed to fetch ticket' });
      return;
    }

    const data = await response.json();
    res.json(data.fields);
  } catch (error) {
    console.error('Error fetching ticket fields:', error);
    res.status(500).json({ error: 'Failed to fetch ticket fields' });
  }
});

// Get refinement tickets from JIRA (TVSMART, TVORA, TVFREE, TVSFR)
router.get('/jira/refinement-tickets', async (_req: Request, res: Response) => {
  try {
    if (!config.jira.baseUrl || !config.jira.email || !config.jira.apiToken) {
      res.status(400).json({ error: 'JIRA not configured' });
      return;
    }

    const tickets = await jiraService.searchRefinementTickets({
      baseUrl: config.jira.baseUrl,
      email: config.jira.email,
      apiToken: config.jira.apiToken,
    });

    res.json({ tickets });
  } catch (error) {
    console.error('Error searching JIRA tickets:', error);
    res.status(500).json({ error: 'Failed to search JIRA tickets' });
  }
});

// Get JIRA ticket details
router.get('/jira/ticket/:ticketKey', async (req: Request, res: Response) => {
  try {
    const { ticketKey } = req.params;
    const baseUrl = req.headers['x-jira-base-url'] as string;
    const email = req.headers['x-jira-email'] as string;
    const apiToken = req.headers['x-jira-api-token'] as string;

    if (!baseUrl || !email || !apiToken) {
      res.status(400).json({ error: 'JIRA configuration headers required' });
      return;
    }

    const ticket = await jiraService.getTicket({ baseUrl, email, apiToken }, ticketKey);
    res.json(ticket);
  } catch (error) {
    console.error('Error fetching JIRA ticket:', error);
    res.status(500).json({ error: 'Failed to fetch JIRA ticket' });
  }
});

// Create a new session
router.post('/rooms/:code/sessions', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const { jiraTicketKey } = req.body;

    const room = await roomService.getRoomByCode(code);
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    const session = await roomService.createSession(room.id, jiraTicketKey);
    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

export default router;
