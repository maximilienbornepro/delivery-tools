import type { PIState, HiddenTask } from '../types';

const API_BASE_URL = '/api/pi-state';

export async function fetchPIState(projectId: string, piId: string): Promise<PIState> {
  const response = await fetch(`${API_BASE_URL}/${projectId}/${piId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch PI state');
  }
  return response.json();
}

export async function toggleFreeze(projectId: string, piId: string): Promise<PIState> {
  const response = await fetch(`${API_BASE_URL}/${projectId}/${piId}/freeze`, {
    method: 'PUT',
  });
  if (!response.ok) {
    throw new Error('Failed to toggle freeze');
  }
  return response.json();
}

export async function hideTask(projectId: string, piId: string, jiraKey: string, title?: string): Promise<{ hiddenTasks: HiddenTask[] }> {
  const response = await fetch(`${API_BASE_URL}/${projectId}/${piId}/hide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jiraKey, title }),
  });
  if (!response.ok) {
    throw new Error('Failed to hide task');
  }
  return response.json();
}

export async function restoreTask(projectId: string, piId: string, jiraKey: string): Promise<{ hiddenTasks: HiddenTask[] }> {
  const response = await fetch(`${API_BASE_URL}/${projectId}/${piId}/hide/${jiraKey}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to restore task');
  }
  return response.json();
}

export async function restoreTasks(projectId: string, piId: string, jiraKeys: string[]): Promise<{ hiddenTasks: HiddenTask[] }> {
  const response = await fetch(`${API_BASE_URL}/${projectId}/${piId}/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jiraKeys }),
  });
  if (!response.ok) {
    throw new Error('Failed to restore tasks');
  }
  return response.json();
}
