const API_BASE_URL = '/api/confidence';

export interface ConfidenceItem {
  id: number;
  label: string;
}

export interface ConfidenceDataFull {
  piId: string;
  projectId: string;
  score: number;
  questions: ConfidenceItem[];
  improvements: ConfidenceItem[];
}

export async function fetchConfidenceData(projectId: string, piId: string): Promise<ConfidenceDataFull> {
  const response = await fetch(`${API_BASE_URL}/${projectId}/${piId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch confidence data');
  }
  return response.json();
}

export async function updateConfidenceScore(projectId: string, piId: string, score: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/${projectId}/${piId}/score`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score }),
  });
  if (!response.ok) {
    throw new Error('Failed to update score');
  }
}

export async function addQuestion(projectId: string, piId: string, label: string): Promise<ConfidenceItem> {
  const response = await fetch(`${API_BASE_URL}/${projectId}/${piId}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label }),
  });
  if (!response.ok) {
    throw new Error('Failed to add question');
  }
  return response.json();
}

export async function updateQuestion(id: number, label: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/questions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label }),
  });
  if (!response.ok) {
    throw new Error('Failed to update question');
  }
}

export async function deleteQuestion(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/questions/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete question');
  }
}

export async function addImprovement(projectId: string, piId: string, label: string): Promise<ConfidenceItem> {
  const response = await fetch(`${API_BASE_URL}/${projectId}/${piId}/improvements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label }),
  });
  if (!response.ok) {
    throw new Error('Failed to add improvement');
  }
  return response.json();
}

export async function updateImprovement(id: number, label: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/improvements/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label }),
  });
  if (!response.ok) {
    throw new Error('Failed to update improvement');
  }
}

export async function deleteImprovement(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/improvements/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete improvement');
  }
}
