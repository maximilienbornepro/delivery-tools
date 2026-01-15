const API_BASE_URL = '/api/positions';

export interface TaskPosition {
  taskId: string;
  piId: string;
  projectId: string;
  startCol: number;
  endCol: number;
  row: number;
}

export async function saveTaskPosition(position: TaskPosition): Promise<void> {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(position),
  });
  if (!response.ok) {
    throw new Error('Failed to save position');
  }
}

export async function getTaskPositions(projectId: string, piId: string): Promise<TaskPosition[]> {
  const response = await fetch(`${API_BASE_URL}/${projectId}/${piId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch positions');
  }
  return response.json();
}

export async function deleteTaskPosition(projectId: string, piId: string, taskId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/${projectId}/${piId}/${taskId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete position');
  }
}
