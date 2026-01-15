import { Router, Request, Response } from 'express';
import {
  getCurrentSprintIssues,
  getProjectSprints,
  getBoards,
  mapJiraStatus,
  mapJiraType,
} from '../services/jiraService';

const router = Router();

// Get all boards
router.get('/boards', async (_req: Request, res: Response) => {
  try {
    const boards = await getBoards();
    res.json(boards);
  } catch (error) {
    console.error('Error fetching boards:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get sprints for a project
router.get('/sprints/:projectKey', async (req: Request, res: Response) => {
  try {
    const projectKey = req.params.projectKey as string;
    const sprints = await getProjectSprints(projectKey);
    res.json(sprints);
  } catch (error) {
    console.error('Error fetching sprints:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Convert seconds to days (8 hours = 1 day)
function secondsToDays(seconds?: number): number | null {
  if (!seconds) return null;
  return Math.round((seconds / (8 * 60 * 60)) * 10) / 10; // 1 decimal place
}

// Get current sprint issues for a project
router.get('/issues/:projectKey', async (req: Request, res: Response) => {
  try {
    const projectKey = req.params.projectKey as string;
    const data = await getCurrentSprintIssues(projectKey);

    // Transform JIRA issues to our task format
    const tasks = data.issues.map((issue: any, index: number) => ({
      id: issue.key,
      jiraKey: issue.key,
      title: `${issue.key} - ${issue.fields.summary}`,
      type: mapJiraType(issue.fields.issuetype.name),
      status: mapJiraStatus(issue.fields.status.name),
      jiraStatus: issue.fields.status.name,
      storyPoints: issue.fields.customfield_10016 || 0,
      assignee: issue.fields.assignee?.displayName || null,
      assigneeAvatar: issue.fields.assignee?.avatarUrls?.['48x48'] || null,
      priority: issue.fields.priority?.name || 'Medium',
      sprint: issue.fields.customfield_10020?.[0]?.name || null,
      fixVersion: issue.fields.fixVersions?.[0]?.name || null,
      estimatedDays: secondsToDays(issue.fields.timetracking?.originalEstimateSeconds),
      // Default positioning - will be adjusted by the client
      platform: 'MOBILE' as const,
      sprintId: issue.fields.customfield_10020?.[0]?.id?.toString() || 's1',
      startCol: index % 6,
      endCol: (index % 6) + 1,
      row: Math.floor(index / 6),
    }));

    res.json({
      sprints: data.sprints,
      tasks,
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
