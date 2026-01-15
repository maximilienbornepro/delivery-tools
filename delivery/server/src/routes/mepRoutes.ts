import { Router, Request, Response } from 'express';
import { getProjectVersions, getVersionsByDateRange } from '../services/jiraService';

const router = Router();

// Get all versions for a project
router.get('/:projectId', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string;
    const versions = await getProjectVersions(projectId);
    res.json(versions);
  } catch (error) {
    console.error('Error fetching versions:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get versions filtered by release date range for a project
router.get('/:projectId/range', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate query parameters are required' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const versions = await getVersionsByDateRange(projectId, startDate as string, endDate as string);
    res.json(versions);
  } catch (error) {
    console.error('Error fetching versions:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
