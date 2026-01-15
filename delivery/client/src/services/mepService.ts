const API_BASE_URL = '/api/mep';

export interface JiraVersionIssue {
  key: string;
  summary: string;
}

export interface JiraVersion {
  id: string;
  name: string;
  releaseDate?: string;
  issues: JiraVersionIssue[];
}

export async function fetchVersions(projectId: string): Promise<JiraVersion[]> {
  const response = await fetch(`${API_BASE_URL}/${projectId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch versions');
  }
  return response.json();
}

export async function fetchVersionsByDateRange(projectId: string, startDate: string, endDate: string): Promise<JiraVersion[]> {
  const params = new URLSearchParams({ startDate, endDate });
  const response = await fetch(`${API_BASE_URL}/${projectId}/range?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch versions');
  }
  return response.json();
}
