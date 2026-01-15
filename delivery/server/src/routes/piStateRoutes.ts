import { Router } from 'express';
import {
  getPIState,
  togglePIFreeze,
  hideJiraKey,
  restoreJiraKey,
  restoreJiraKeys,
} from '../services/dbService';

const router = Router();

// GET /api/pi-state/:projectId/:piId - Get PI state (freeze status + hidden keys)
router.get('/:projectId/:piId', async (req, res) => {
  try {
    const projectId = req.params.projectId as string;
    const piId = req.params.piId as string;
    const state = await getPIState(projectId, piId);
    res.json(state);
  } catch (error) {
    console.error('Error fetching PI state:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// PUT /api/pi-state/:projectId/:piId/freeze - Toggle freeze state
router.put('/:projectId/:piId/freeze', async (req, res) => {
  try {
    const projectId = req.params.projectId as string;
    const piId = req.params.piId as string;
    const state = await togglePIFreeze(projectId, piId);
    res.json(state);
  } catch (error) {
    console.error('Error toggling freeze:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /api/pi-state/:projectId/:piId/hide - Hide a JIRA ticket
router.post('/:projectId/:piId/hide', async (req, res) => {
  try {
    const projectId = req.params.projectId as string;
    const piId = req.params.piId as string;
    const { jiraKey, title } = req.body;

    if (!jiraKey) {
      res.status(400).json({ error: 'jiraKey is required' });
      return;
    }

    const hiddenTasks = await hideJiraKey(projectId, piId, jiraKey, title);
    res.json({ hiddenTasks });
  } catch (error) {
    console.error('Error hiding JIRA key:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// DELETE /api/pi-state/:projectId/:piId/hide/:jiraKey - Restore a single hidden ticket
router.delete('/:projectId/:piId/hide/:jiraKey', async (req, res) => {
  try {
    const projectId = req.params.projectId as string;
    const piId = req.params.piId as string;
    const jiraKey = req.params.jiraKey as string;

    const hiddenTasks = await restoreJiraKey(projectId, piId, jiraKey);
    res.json({ hiddenTasks });
  } catch (error) {
    console.error('Error restoring JIRA key:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /api/pi-state/:projectId/:piId/restore - Restore multiple tickets
router.post('/:projectId/:piId/restore', async (req, res) => {
  try {
    const projectId = req.params.projectId as string;
    const piId = req.params.piId as string;
    const { jiraKeys } = req.body;

    if (!jiraKeys || !Array.isArray(jiraKeys)) {
      res.status(400).json({ error: 'jiraKeys array is required' });
      return;
    }

    const hiddenTasks = await restoreJiraKeys(projectId, piId, jiraKeys);
    res.json({ hiddenTasks });
  } catch (error) {
    console.error('Error restoring JIRA keys:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
