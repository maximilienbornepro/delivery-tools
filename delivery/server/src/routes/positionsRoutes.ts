import { Router, Request, Response } from 'express';
import {
  saveTaskPosition,
  getTaskPositions,
  deleteTaskPosition,
} from '../services/dbService';

const router = Router();

// Get all positions for a project + PI
router.get('/:projectId/:piId', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string;
    const piId = req.params.piId as string;
    const positions = await getTaskPositions(projectId, piId);
    res.json(positions);
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Save or update a task position
router.post('/', async (req: Request, res: Response) => {
  try {
    const { taskId, piId, projectId, startCol, endCol, row } = req.body;

    if (!taskId || !piId || !projectId) {
      res.status(400).json({ error: 'taskId, piId, and projectId are required' });
      return;
    }

    await saveTaskPosition({
      taskId,
      piId,
      projectId,
      startCol: startCol ?? 0,
      endCol: endCol ?? 1,
      row: row ?? 0,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving position:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Delete a task position
router.delete('/:projectId/:piId/:taskId', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string;
    const piId = req.params.piId as string;
    const taskId = req.params.taskId as string;
    await deleteTaskPosition(projectId, piId, taskId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting position:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
