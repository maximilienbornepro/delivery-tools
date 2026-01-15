import { Router } from 'express';
import {
  getConfidenceData,
  updateConfidenceScore,
  addConfidenceQuestion,
  deleteConfidenceQuestion,
  updateConfidenceQuestion,
  addConfidenceImprovement,
  deleteConfidenceImprovement,
  updateConfidenceImprovement,
} from '../services/dbService';

const router = Router();

// Get confidence data for a project + PI
router.get('/:projectId/:piId', async (req, res) => {
  try {
    const projectId = req.params.projectId as string;
    const piId = req.params.piId as string;
    const data = await getConfidenceData(projectId, piId);
    res.json(data);
  } catch (error) {
    console.error('Error fetching confidence data:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update confidence score
router.put('/:projectId/:piId/score', async (req, res) => {
  try {
    const projectId = req.params.projectId as string;
    const piId = req.params.piId as string;
    const { score } = req.body;
    await updateConfidenceScore(projectId, piId, score);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating confidence score:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Add a question
router.post('/:projectId/:piId/questions', async (req, res) => {
  try {
    const projectId = req.params.projectId as string;
    const piId = req.params.piId as string;
    const { label } = req.body;
    const id = await addConfidenceQuestion(projectId, piId, label);
    res.json({ id, label });
  } catch (error) {
    console.error('Error adding question:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update a question
router.put('/questions/:id', async (req, res) => {
  try {
    const id = req.params.id as string;
    const { label } = req.body;
    await updateConfidenceQuestion(parseInt(id), label);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Delete a question
router.delete('/questions/:id', async (req, res) => {
  try {
    const id = req.params.id as string;
    await deleteConfidenceQuestion(parseInt(id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Add an improvement
router.post('/:projectId/:piId/improvements', async (req, res) => {
  try {
    const projectId = req.params.projectId as string;
    const piId = req.params.piId as string;
    const { label } = req.body;
    const id = await addConfidenceImprovement(projectId, piId, label);
    res.json({ id, label });
  } catch (error) {
    console.error('Error adding improvement:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update an improvement
router.put('/improvements/:id', async (req, res) => {
  try {
    const id = req.params.id as string;
    const { label } = req.body;
    await updateConfidenceImprovement(parseInt(id), label);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating improvement:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Delete an improvement
router.delete('/improvements/:id', async (req, res) => {
  try {
    const id = req.params.id as string;
    await deleteConfidenceImprovement(parseInt(id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting improvement:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
