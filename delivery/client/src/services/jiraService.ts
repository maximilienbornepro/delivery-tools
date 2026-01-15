const API_BASE_URL = '/api/jira';

export interface JiraTask {
  id: string;
  jiraKey: string;
  title: string;
  type: 'feature' | 'tech' | 'bug' | 'milestone' | 'api' | 'player';
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  jiraStatus: string;
  storyPoints: number;
  estimatedDays: number | null;
  assignee: string | null;
  assigneeAvatar: string | null;
  priority: string;
  sprint: string | null;
  fixVersion: string | null;
  platform: 'SMARTTV';
  sprintId: string;
  startCol: number;
  endCol: number;
  row: number;
}

export interface JiraSprint {
  id: number;
  name: string;
  state: string;
  startDate?: string;
  endDate?: string;
}

export interface JiraData {
  sprints: JiraSprint[];
  tasks: JiraTask[];
}

export async function fetchJiraBoards() {
  const response = await fetch(`${API_BASE_URL}/boards`);
  if (!response.ok) {
    throw new Error('Failed to fetch boards');
  }
  return response.json();
}

export async function fetchJiraSprints(projectKey: string = 'SMARTV') {
  const response = await fetch(`${API_BASE_URL}/sprints/${projectKey}`);
  if (!response.ok) {
    throw new Error('Failed to fetch sprints');
  }
  return response.json();
}

export async function fetchJiraIssues(projectKey: string = 'SMARTV'): Promise<JiraData> {
  const response = await fetch(`${API_BASE_URL}/issues/${projectKey}`);
  if (!response.ok) {
    throw new Error('Failed to fetch issues');
  }
  return response.json();
}
