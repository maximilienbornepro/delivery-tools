const API_BASE = '/api/v1';

export const api = {
  async createRoom(name: string, createdBy: string) {
    const response = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, createdBy }),
    });
    if (!response.ok) throw new Error('Failed to create room');
    return response.json();
  },

  async getRoom(code: string) {
    const response = await fetch(`${API_BASE}/rooms/${code}`);
    if (!response.ok) throw new Error('Room not found');
    return response.json();
  },

  async joinRoom(code: string, name: string) {
    const response = await fetch(`${API_BASE}/rooms/${code}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error('Failed to join room');
    return response.json();
  },

  async configureJira(code: string, baseUrl: string, email: string, apiToken: string) {
    const response = await fetch(`${API_BASE}/rooms/${code}/jira`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseUrl, email, apiToken }),
    });
    if (!response.ok) throw new Error('Failed to configure JIRA');
    return response.json();
  },

  async getConfig() {
    const response = await fetch(`${API_BASE}/config`);
    if (!response.ok) throw new Error('Failed to get config');
    return response.json() as Promise<{ jiraConfigured: boolean; jiraBaseUrl: string | null }>;
  },

  async searchJiraTickets() {
    const response = await fetch(`${API_BASE}/jira/refinement-tickets`);
    if (!response.ok) throw new Error('Failed to search tickets');
    return response.json() as Promise<{ tickets: Array<{ key: string; summary: string }> }>;
  },
};
