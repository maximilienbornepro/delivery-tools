import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root (4 levels up: services -> src -> server -> delivery -> root)
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '..', '.env') });
// Also try local .env for backwards compatibility
dotenv.config();

const JIRA_BASE_URL = process.env.JIRA_BASE_URL!;
const JIRA_EMAIL = process.env.JIRA_EMAIL!;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN!;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY || 'SMARTV';

const authHeader = `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`;

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
      statusCategory: {
        key: string;
      };
    };
    issuetype: {
      name: string;
    };
    priority?: {
      name: string;
    };
    assignee?: {
      displayName: string;
      avatarUrls?: {
        '48x48': string;
      };
    };
    customfield_10016?: number; // Story Points
    customfield_10020?: Array<{
      id: number;
      name: string;
      state: string;
    }>; // Sprint
    fixVersions?: Array<{
      id: string;
      name: string;
    }>;
    versions?: Array<{
      id: string;
      name: string;
    }>;
    timetracking?: {
      originalEstimate?: string; // e.g., "3d", "1w 2d"
      originalEstimateSeconds?: number;
    };
  };
}

interface JiraSprint {
  id: number;
  name: string;
  state: string;
  startDate?: string;
  endDate?: string;
}

interface JiraBoard {
  id: number;
  name: string;
  type: string;
}

interface JiraResponse {
  values?: JiraBoard[] | JiraSprint[];
  issues?: JiraIssue[];
  [key: string]: unknown;
}

async function jiraFetch(endpoint: string, options: RequestInit = {}): Promise<JiraResponse> {
  const url = `${JIRA_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`JIRA API Error: ${response.status} - ${error}`);
  }

  return response.json() as Promise<JiraResponse>;
}

export async function getBoards(): Promise<JiraBoard[]> {
  const data = await jiraFetch('/rest/agile/1.0/board');
  return (data.values || []) as JiraBoard[];
}

export async function getBoardByName(name: string): Promise<JiraBoard | undefined> {
  const data = await jiraFetch(`/rest/agile/1.0/board?name=${encodeURIComponent(name)}`);
  return (data.values as JiraBoard[])?.[0];
}

export async function getActiveSprints(boardId: number): Promise<JiraSprint[]> {
  const data = await jiraFetch(`/rest/agile/1.0/board/${boardId}/sprint?state=active`);
  return (data.values || []) as JiraSprint[];
}

export async function getAllSprints(boardId: number): Promise<JiraSprint[]> {
  const data = await jiraFetch(`/rest/agile/1.0/board/${boardId}/sprint?state=active,future`);
  return (data.values || []) as JiraSprint[];
}

export async function getSprintIssues(sprintId: number): Promise<JiraIssue[]> {
  const data = await jiraFetch(
    `/rest/agile/1.0/sprint/${sprintId}/issue?fields=summary,status,issuetype,priority,assignee,customfield_10016,customfield_10020,fixVersions,versions,timetracking`
  );
  return data.issues || [];
}

export async function searchIssues(jql: string): Promise<JiraIssue[]> {
  // Use new JIRA API endpoint
  const params = new URLSearchParams({
    jql,
    fields: 'summary,status,issuetype,priority,assignee,customfield_10016,customfield_10020,fixVersions,versions,timetracking',
    maxResults: '100',
  });
  const data = await jiraFetch(`/rest/api/3/search/jql?${params.toString()}`);
  return data.issues || [];
}

// Filter out test-related issues, bugs/anomalies, and abandoned issues
function filterOutExcludedIssues(issues: JiraIssue[]): JiraIssue[] {
  const excludedTypes = ['test set', 'test', 'test execution', 'anomalie', 'bug'];
  const excludedStatuses = ['abandonné', 'abandonnée', 'abandoned'];

  return issues.filter(issue => {
    const issueType = issue.fields.issuetype.name.toLowerCase();
    const summary = issue.fields.summary.toLowerCase();
    const status = issue.fields.status.name.toLowerCase();

    // Exclude by issue type
    if (excludedTypes.includes(issueType)) return false;

    // Exclude if summary starts with "Test set"
    if (summary.startsWith('test set')) return false;

    // Exclude abandoned issues
    if (excludedStatuses.includes(status)) return false;

    return true;
  });
}

// Helper to get special sprint issues (Refinement, Cadrage, etc.)
async function getSpecialSprintIssues(projectKey: string): Promise<JiraIssue[]> {
  const jqlAll = `project = ${projectKey} AND sprint is not EMPTY AND statusCategory != Done AND issuetype NOT IN ("Test Set", "Test", "Test Execution", "Anomalie", "Bug") ORDER BY rank`;
  const allIssues = await searchIssues(jqlAll);

  // Filter to only include those with sprint names containing special keywords
  const specialSprintKeywords = ['refinement', 'cadrage', 'a planifier', 'en cadrage'];
  return allIssues.filter(issue => {
    const sprintField = issue.fields.customfield_10020;
    if (!sprintField || sprintField.length === 0) return false;
    const sprintName = sprintField[0].name?.toLowerCase() || '';
    return specialSprintKeywords.some(keyword => sprintName.includes(keyword));
  });
}

export async function getCurrentSprintIssues(projectKey: string = JIRA_PROJECT_KEY) {
  // Try to find board for project
  const board = await getBoardByName(projectKey);

  // Always get special sprint issues (Refinement, Cadrage, etc.)
  const specialIssues = await getSpecialSprintIssues(projectKey);
  console.log(`Found ${specialIssues.length} issues in special sprints for ${projectKey}`);

  if (board) {
    try {
      // Get active sprints from board (only works for Scrum boards)
      const activeSprints = await getActiveSprints(board.id);
      if (activeSprints.length > 0) {
        // Get issues for each active sprint
        const activeIssues: JiraIssue[] = [];
        for (const sprint of activeSprints) {
          const issues = await getSprintIssues(sprint.id);
          activeIssues.push(...issues);
        }

        // Merge active sprint issues with special sprint issues
        const issueMap = new Map<string, JiraIssue>();
        for (const issue of activeIssues) {
          issueMap.set(issue.key, issue);
        }
        for (const issue of specialIssues) {
          if (!issueMap.has(issue.key)) {
            issueMap.set(issue.key, issue);
          }
        }

        // Filter out test issues
        const filteredIssues = filterOutExcludedIssues(Array.from(issueMap.values()));
        return {
          sprints: activeSprints,
          issues: filteredIssues,
        };
      }
    } catch (error) {
      // Board doesn't support sprints (Kanban board)
      console.log(`Board for ${projectKey} doesn't support sprints, using JQL`);
    }
  }

  // Fallback: Get issues from open sprints via JQL
  console.log(`Using JQL search for ${projectKey}`);
  const jqlOpen = `project = ${projectKey} AND sprint in openSprints() AND statusCategory != Done AND issuetype NOT IN ("Test Set", "Test", "Test Execution", "Anomalie", "Bug") ORDER BY rank`;
  const openIssues = await searchIssues(jqlOpen);

  // Merge and dedupe by issue key
  const issueMap = new Map<string, JiraIssue>();
  for (const issue of openIssues) {
    issueMap.set(issue.key, issue);
  }
  for (const issue of specialIssues) {
    if (!issueMap.has(issue.key)) {
      issueMap.set(issue.key, issue);
    }
  }
  const issues = Array.from(issueMap.values());

  // Also filter by summary for JQL results
  const filteredIssues = filterOutExcludedIssues(issues);

  return {
    sprints: [],
    issues: filteredIssues,
  };
}

export async function getProjectSprints(projectKey: string = JIRA_PROJECT_KEY) {
  const board = await getBoardByName(projectKey);
  if (!board) {
    throw new Error(`Board not found for project: ${projectKey}`);
  }
  return getAllSprints(board.id);
}

// Map JIRA status to our task status
export function mapJiraStatus(status: string): 'todo' | 'in_progress' | 'done' | 'blocked' {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('done') || statusLower.includes('terminé') || statusLower.includes('fermé')) {
    return 'done';
  }
  if (statusLower.includes('progress') || statusLower.includes('cours') || statusLower.includes('review')) {
    return 'in_progress';
  }
  if (statusLower.includes('block') || statusLower.includes('bloqu')) {
    return 'blocked';
  }
  return 'todo';
}

// Map JIRA issue type to our task type
export function mapJiraType(issueType: string): 'feature' | 'tech' | 'bug' | 'milestone' | 'api' | 'player' {
  const typeLower = issueType.toLowerCase();
  if (typeLower.includes('bug')) return 'bug';
  if (typeLower.includes('tech') || typeLower.includes('spike') || typeLower.includes('debt')) return 'tech';
  if (typeLower.includes('epic') || typeLower.includes('milestone')) return 'milestone';
  return 'feature';
}

export interface JiraVersionIssue {
  key: string;
  summary: string;
}

export interface JiraVersion {
  id: string;
  name: string;
  description?: string;
  releaseDate?: string;
  released: boolean;
  issueCount: number;
  issues: JiraVersionIssue[];
}

// Get versions from project by searching issues with fixVersions
// Only fetches Stories/Récits (not bugs, tasks, tests)
export async function getProjectVersions(projectKey: string = JIRA_PROJECT_KEY): Promise<JiraVersion[]> {
  // Search for Stories/Récits only with fixVersions
  const jql = `project = ${projectKey} AND fixVersion IS NOT EMPTY AND issuetype in (Story, Récit) ORDER BY fixVersion DESC`;
  const params = new URLSearchParams({
    jql,
    fields: 'fixVersions,summary,status,issuetype',
    maxResults: '500',
  });

  const data = await jiraFetch(`/rest/api/3/search/jql?${params.toString()}`);
  const issues = data.issues || [];

  // Extract unique versions with their details and issues
  const versionMap = new Map<string, JiraVersion>();

  for (const issue of issues) {
    const jiraIssue = issue as JiraIssue;
    const fixVersions = jiraIssue.fields.fixVersions || [];

    for (const version of fixVersions) {
      if (!versionMap.has(version.id)) {
        versionMap.set(version.id, {
          id: version.id,
          name: version.name,
          description: (version as any).description || undefined,
          releaseDate: (version as any).releaseDate || undefined,
          released: (version as any).released || false,
          issueCount: 1,
          issues: [{
            key: jiraIssue.key,
            summary: jiraIssue.fields.summary,
          }],
        });
      } else {
        const existing = versionMap.get(version.id)!;
        existing.issueCount++;
        existing.issues.push({
          key: jiraIssue.key,
          summary: jiraIssue.fields.summary,
        });
      }
    }
  }

  // Sort by version name (descending)
  return Array.from(versionMap.values()).sort((a, b) => {
    // Parse version numbers for proper sorting
    const parseVersion = (name: string) => {
      const match = name.match(/(\d+)\.(\d+)\.(\d+)/);
      if (match) {
        return parseInt(match[1]) * 10000 + parseInt(match[2]) * 100 + parseInt(match[3]);
      }
      return 0;
    };
    return parseVersion(b.name) - parseVersion(a.name);
  });
}

// Get versions filtered by date range
export async function getVersionsByDateRange(
  projectKey: string,
  startDate: string,
  endDate: string
): Promise<JiraVersion[]> {
  const allVersions = await getProjectVersions(projectKey);

  const start = new Date(startDate);
  const end = new Date(endDate);

  return allVersions.filter(version => {
    if (!version.releaseDate) return false;
    const releaseDate = new Date(version.releaseDate);
    return releaseDate >= start && releaseDate <= end;
  });
}
