interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

interface JiraTicket {
  key: string;
  summary: string;
  storyPoints?: number;
  timeEstimate?: string;
}

export const jiraService = {
  async getTicket(config: JiraConfig, ticketKey: string): Promise<JiraTicket> {
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');

    const response = await fetch(
      `${config.baseUrl}/rest/api/3/issue/${ticketKey}`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`JIRA API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as {
      key: string;
      fields: {
        summary: string;
        customfield_10016?: number;
        timeoriginalestimate?: number;
      };
    };

    return {
      key: data.key,
      summary: data.fields.summary,
      storyPoints: data.fields.customfield_10016,
      timeEstimate: data.fields.timeoriginalestimate
        ? formatSeconds(data.fields.timeoriginalestimate)
        : undefined,
    };
  },

  async getStoryPointsFieldId(config: JiraConfig): Promise<string | null> {
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');

    const response = await fetch(
      `${config.baseUrl}/rest/api/3/field`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to get JIRA fields');
      return null;
    }

    const fields = await response.json() as Array<{ id: string; name: string; custom: boolean }>;

    // Look for Story Points field (common names)
    const storyPointsField = fields.find(
      (f) => f.name.toLowerCase().includes('story point') ||
             f.name.toLowerCase() === 'points' ||
             f.name.toLowerCase() === 'estimation'
    );

    console.log('Available custom fields:', fields.filter(f => f.custom).map(f => ({ id: f.id, name: f.name })));

    return storyPointsField?.id || null;
  },

  async updateEstimate(
    config: JiraConfig,
    ticketKey: string,
    storyPoints: number,
    timeEstimate?: string
  ): Promise<void> {
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');

    // First, try to find the correct Story Points field ID
    const storyPointsFieldId = await this.getStoryPointsFieldId(config);

    if (!storyPointsFieldId) {
      console.error('Story Points field not found in JIRA');
      throw new Error('Story Points field not found in JIRA configuration');
    }

    console.log(`Using Story Points field: ${storyPointsFieldId}`);

    const fields: Record<string, unknown> = {
      [storyPointsFieldId]: storyPoints,
    };

    // Add time tracking if provided (uses format like "2d", "4h", "1d 2h")
    if (timeEstimate) {
      fields['timetracking'] = {
        originalEstimate: timeEstimate,
      };
    }

    const response = await fetch(
      `${config.baseUrl}/rest/api/3/issue/${ticketKey}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ fields }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('JIRA update error:', errorText);
      throw new Error(`JIRA API error: ${response.status} - ${errorText}`);
    }

    console.log(`Successfully updated ${ticketKey} with ${storyPoints} story points${timeEstimate ? ` and ${timeEstimate} time estimate` : ''}`);
  },

  async getOpenSprints(config: JiraConfig, boardId: number): Promise<Array<{ id: number; name: string; state: string }>> {
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');

    const response = await fetch(
      `${config.baseUrl}/rest/agile/1.0/board/${boardId}/sprint?state=active,future`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json() as { values: Array<{ id: number; name: string; state: string }> };
    return data.values || [];
  },

  async searchRefinementTickets(config: JiraConfig): Promise<JiraTicket[]> {
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');

    // JQL to find tickets:
    // - In specific projects (TVSMART, TVORA, TVFREE, TVSFR)
    // - In sprints containing "Refinement" (not necessarily active)
    // - Without Story Points
    // - Only Tasks and Stories (exclude Bugs/Anomalies)
    const jql = `project in (TVSMART, TVORA, TVFREE, TVSFR) AND sprint ~ "Refinement" AND "Story Points" is EMPTY AND issuetype in (Story, Task) ORDER BY project, key`;

    console.log('JQL Query:', jql);

    // Use the new JIRA search API endpoint
    const response = await fetch(
      `${config.baseUrl}/rest/api/3/search/jql`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          jql,
          fields: ['key', 'summary', 'customfield_10016', 'customfield_10028', 'customfield_10020'],
          maxResults: 100,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('JIRA search error:', errorText);
      throw new Error(`JIRA API error: ${response.status}`);
    }

    const data = await response.json() as {
      issues: Array<{
        key: string;
        fields: {
          summary: string;
          customfield_10016?: number;
          customfield_10028?: number;
          customfield_10020?: Array<{ name: string; state: string }>;
        };
      }>;
    };

    // Log sprint names to understand the naming convention
    const sprintNames = new Set<string>();
    data.issues.forEach((issue) => {
      if (issue.fields.customfield_10020) {
        issue.fields.customfield_10020.forEach((sprint) => {
          sprintNames.add(sprint.name);
        });
      }
    });
    console.log('Sprint names found:', Array.from(sprintNames));

    return data.issues.map((issue) => ({
      key: issue.key,
      summary: issue.fields.summary,
      storyPoints: issue.fields.customfield_10016 || issue.fields.customfield_10028 || undefined,
    }));
  },

async addComment(config: JiraConfig, ticketKey: string, comment: string): Promise<void> {
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');

    const response = await fetch(
      `${config.baseUrl}/rest/api/3/issue/${ticketKey}/comment`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          body: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: comment,
                  },
                ],
              },
            ],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to add comment to ${ticketKey}:`, errorText);
      throw new Error(`Failed to add comment: ${response.status}`);
    }

    console.log(`Successfully added comment to ${ticketKey}`);
  },

  async updateTicketSummary(config: JiraConfig, ticketKey: string, newSummary: string): Promise<void> {
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');

    const response = await fetch(
      `${config.baseUrl}/rest/api/3/issue/${ticketKey}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            summary: newSummary,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to update summary for ${ticketKey}:`, errorText);
      throw new Error(`Failed to update summary: ${response.status}`);
    }

    console.log(`Successfully updated summary for ${ticketKey}`);
  },

  async markTicketNeedsRework(config: JiraConfig, ticketKey: string, comment: string): Promise<{ sprintMoved: boolean; sprintError?: string }> {
    // First get the current ticket to check/update summary
    const ticket = await this.getTicket(config, ticketKey);
    const prefix = '(à retravailler suite au Refinement)';

    // Add prefix if not already present
    if (!ticket.summary.startsWith(prefix)) {
      const newSummary = `${prefix} ${ticket.summary}`;
      await this.updateTicketSummary(config, ticketKey, newSummary);
    }

    // Add the comment
    if (comment.trim()) {
      await this.addComment(config, ticketKey, comment);
    }

    // Try to move to Cadrage sprint
    const projectKey = ticketKey.split('-')[0];
    const cadrageSprint = await this.findCadrageSprint(config, projectKey);

    if (cadrageSprint) {
      await this.moveTicketToSprint(config, ticketKey, cadrageSprint.id);
      return { sprintMoved: true };
    } else {
      return {
        sprintMoved: false,
        sprintError: `Le sprint "Cadrage" ou "En cadrage" n'existe pas pour le projet ${projectKey}`
      };
    }
  },

  async findCadrageSprint(config: JiraConfig, projectKey: string): Promise<{ id: number; name: string } | null> {
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');

    // First, find the board for this project
    const boardResponse = await fetch(
      `${config.baseUrl}/rest/agile/1.0/board?projectKeyOrId=${projectKey}`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!boardResponse.ok) {
      console.error(`Failed to get boards for project ${projectKey}`);
      return null;
    }

    const boardData = await boardResponse.json() as { values: Array<{ id: number; name: string }> };
    if (!boardData.values || boardData.values.length === 0) {
      console.error(`No board found for project ${projectKey}`);
      return null;
    }

    // Try each board to find the "Cadrage" or "En cadrage" sprint
    for (const board of boardData.values) {
      const sprintsResponse = await fetch(
        `${config.baseUrl}/rest/agile/1.0/board/${board.id}/sprint?state=active,future`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!sprintsResponse.ok) {
        continue;
      }

      const sprintsData = await sprintsResponse.json() as { values: Array<{ id: number; name: string; state: string }> };
      const cadrageSprint = sprintsData.values?.find(
        sprint => sprint.name.toLowerCase().includes('cadrage') ||
                  sprint.name.toLowerCase().includes('en cadrage')
      );

      if (cadrageSprint) {
        console.log(`Found "Cadrage" sprint: ${cadrageSprint.name} (ID: ${cadrageSprint.id}) for project ${projectKey}`);
        return { id: cadrageSprint.id, name: cadrageSprint.name };
      }
    }

    console.log(`No "Cadrage" sprint found for project ${projectKey}`);
    return null;
  },

  async findAPlanifierSprint(config: JiraConfig, projectKey: string): Promise<{ id: number; name: string } | null> {
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');

    // First, find the board for this project
    const boardResponse = await fetch(
      `${config.baseUrl}/rest/agile/1.0/board?projectKeyOrId=${projectKey}`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!boardResponse.ok) {
      console.error(`Failed to get boards for project ${projectKey}`);
      return null;
    }

    const boardData = await boardResponse.json() as { values: Array<{ id: number; name: string }> };
    if (!boardData.values || boardData.values.length === 0) {
      console.error(`No board found for project ${projectKey}`);
      return null;
    }

    // Try each board to find the "A planifier" sprint
    for (const board of boardData.values) {
      const sprintsResponse = await fetch(
        `${config.baseUrl}/rest/agile/1.0/board/${board.id}/sprint?state=active,future`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!sprintsResponse.ok) {
        continue;
      }

      const sprintsData = await sprintsResponse.json() as { values: Array<{ id: number; name: string; state: string }> };
      const aPlanifierSprint = sprintsData.values?.find(
        sprint => sprint.name.toLowerCase().includes('a planifier') ||
                  sprint.name.toLowerCase().includes('à planifier')
      );

      if (aPlanifierSprint) {
        console.log(`Found "A planifier" sprint: ${aPlanifierSprint.name} (ID: ${aPlanifierSprint.id}) for project ${projectKey}`);
        return { id: aPlanifierSprint.id, name: aPlanifierSprint.name };
      }
    }

    console.log(`No "A planifier" sprint found for project ${projectKey}`);
    return null;
  },

  async moveTicketToSprint(config: JiraConfig, ticketKey: string, sprintId: number): Promise<void> {
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');

    const response = await fetch(
      `${config.baseUrl}/rest/agile/1.0/sprint/${sprintId}/issue`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          issues: [ticketKey],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to move ticket ${ticketKey} to sprint ${sprintId}:`, errorText);
      throw new Error(`Failed to move ticket to sprint: ${response.status}`);
    }

    console.log(`Successfully moved ticket ${ticketKey} to sprint ${sprintId}`);
  },

  parseTimeEstimate(timeStr: string): number | undefined {
    // Parse time strings like "2h", "1d", "30m", "1d 2h", etc.
    const regex = /(\d+)\s*(d|h|m)/gi;
    let totalSeconds = 0;
    let match;

    while ((match = regex.exec(timeStr)) !== null) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();

      switch (unit) {
        case 'd':
          totalSeconds += value * 8 * 3600; // 8 hours per day
          break;
        case 'h':
          totalSeconds += value * 3600;
          break;
        case 'm':
          totalSeconds += value * 60;
          break;
      }
    }

    return totalSeconds > 0 ? totalSeconds : undefined;
  },
};

function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const days = Math.floor(hours / 8);
  const remainingHours = hours % 8;

  if (days > 0 && remainingHours > 0) {
    return `${days}d ${remainingHours}h`;
  } else if (days > 0) {
    return `${days}d`;
  } else {
    return `${hours}h`;
  }
}
