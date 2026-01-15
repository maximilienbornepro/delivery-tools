export const PROJECTS = ['TVSMART', 'TVFREE', 'TVORA', 'TVSFR', 'TVFIRE'] as const;
export type ProjectKey = typeof PROJECTS[number];

export const ALL_PROJECTS = 'ALL' as const;
export const CHRONOLOGICAL = 'CHRONO' as const;
export type ProjectSelection = ProjectKey | typeof ALL_PROJECTS | typeof CHRONOLOGICAL;

export type Platform = 'SMARTTV';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
export type TaskType = 'feature' | 'tech' | 'bug' | 'milestone' | 'api' | 'player';

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface Task {
  id: string;
  title: string;
  platform: Platform;
  sprintId: string;
  type: TaskType;
  status: TaskStatus;
  startCol?: number;
  endCol?: number;
  row?: number;
  isRetourGoogle?: boolean;
  isMep?: boolean;
  mepVersion?: string;
  mepDate?: string;
  // JIRA fields
  jiraKey?: string;
  jiraStatus?: string;
  storyPoints?: number;
  estimatedDays?: number | null;
  assignee?: string | null;
  assigneeAvatar?: string | null;
  priority?: string;
  fixVersion?: string | null;
  // Project tracking (for combined views)
  projectId?: ProjectKey;
}

export interface ReleaseIssue {
  key: string;
  summary: string;
}

export interface Release {
  id: string;
  date: string;
  version: string;
  issues?: ReleaseIssue[];
}

export interface ConfidenceItem {
  id: number;
  label: string;
}

export interface ConfidenceData {
  piId: string;
  projectId: string;
  score: number;
  questions: ConfidenceItem[];
  improvements: ConfidenceItem[];
}

export interface HiddenTask {
  jiraKey: string;
  title?: string;
}

export interface PIState {
  piId: string;
  projectId: string;
  isFrozen: boolean;
  hiddenJiraKeys: string[];
  hiddenTasks: HiddenTask[];
  frozenAt: string | null;
}
