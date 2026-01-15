import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root (3 levels up: services -> src -> server -> delivery -> root)
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '..', '.env') });
// Also try local .env for backwards compatibility
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DELIVERY_DATABASE_URL || process.env.DATABASE_URL,
});

export interface TaskPosition {
  taskId: string;
  piId: string;
  projectId: string;
  startCol: number;
  endCol: number;
  row: number;
}

export async function initDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_positions (
        id SERIAL PRIMARY KEY,
        task_id VARCHAR(50) NOT NULL,
        pi_id VARCHAR(20) NOT NULL,
        project_id VARCHAR(20) NOT NULL DEFAULT 'TVSMART',
        start_col INTEGER NOT NULL DEFAULT 0,
        end_col INTEGER NOT NULL DEFAULT 1,
        row_index INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(task_id, pi_id, project_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS confidence_data (
        id SERIAL PRIMARY KEY,
        pi_id VARCHAR(20) NOT NULL,
        project_id VARCHAR(20) NOT NULL DEFAULT 'TVSMART',
        score DECIMAL(3,1) NOT NULL DEFAULT 3.0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(pi_id, project_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS confidence_questions (
        id SERIAL PRIMARY KEY,
        pi_id VARCHAR(20) NOT NULL,
        project_id VARCHAR(20) NOT NULL DEFAULT 'TVSMART',
        label VARCHAR(255) NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS confidence_improvements (
        id SERIAL PRIMARY KEY,
        pi_id VARCHAR(20) NOT NULL,
        project_id VARCHAR(20) NOT NULL DEFAULT 'TVSMART',
        label VARCHAR(255) NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS pi_state (
        id SERIAL PRIMARY KEY,
        pi_id VARCHAR(20) NOT NULL,
        project_id VARCHAR(20) NOT NULL DEFAULT 'TVSMART',
        is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
        hidden_jira_keys TEXT[] DEFAULT ARRAY[]::TEXT[],
        hidden_tasks_meta JSONB DEFAULT '{}'::JSONB,
        frozen_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(pi_id, project_id)
      )
    `);

    // Add hidden_tasks_meta column if it doesn't exist (migration for existing tables)
    await client.query(`
      ALTER TABLE pi_state
      ADD COLUMN IF NOT EXISTS hidden_tasks_meta JSONB DEFAULT '{}'::JSONB
    `);

    console.log('Database initialized');
  } finally {
    client.release();
  }
}

export async function saveTaskPosition(position: TaskPosition): Promise<void> {
  console.log('DB: Saving position:', position);
  const query = `
    INSERT INTO task_positions (task_id, pi_id, project_id, start_col, end_col, row_index, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    ON CONFLICT (task_id, pi_id, project_id)
    DO UPDATE SET
      start_col = EXCLUDED.start_col,
      end_col = EXCLUDED.end_col,
      row_index = EXCLUDED.row_index,
      updated_at = CURRENT_TIMESTAMP
  `;
  await pool.query(query, [
    position.taskId,
    position.piId,
    position.projectId,
    position.startCol,
    position.endCol,
    position.row,
  ]);
  console.log('DB: Position saved successfully');
}

export async function getTaskPositions(projectId: string, piId: string): Promise<TaskPosition[]> {
  console.log('DB: Getting positions for project:', projectId, 'PI:', piId);
  const result = await pool.query(
    'SELECT task_id, pi_id, project_id, start_col, end_col, row_index FROM task_positions WHERE project_id = $1 AND pi_id = $2',
    [projectId, piId]
  );
  const positions = result.rows.map((row) => ({
    taskId: row.task_id,
    piId: row.pi_id,
    projectId: row.project_id,
    startCol: row.start_col,
    endCol: row.end_col,
    row: row.row_index,
  }));
  console.log('DB: Found', positions.length, 'positions');
  return positions;
}

export async function deleteTaskPosition(projectId: string, piId: string, taskId: string): Promise<void> {
  await pool.query(
    'DELETE FROM task_positions WHERE project_id = $1 AND pi_id = $2 AND task_id = $3',
    [projectId, piId, taskId]
  );
}

// Confidence Data Types
export interface ConfidenceQuestion {
  id: number;
  label: string;
}

export interface ConfidenceImprovement {
  id: number;
  label: string;
}

export interface ConfidenceDataFull {
  piId: string;
  projectId: string;
  score: number;
  questions: ConfidenceQuestion[];
  improvements: ConfidenceImprovement[];
}

// Get confidence data for a project + PI
export async function getConfidenceData(projectId: string, piId: string): Promise<ConfidenceDataFull> {
  // Get or create the main confidence record
  let result = await pool.query(
    'SELECT score FROM confidence_data WHERE project_id = $1 AND pi_id = $2',
    [projectId, piId]
  );

  let score = 3.0;
  if (result.rows.length === 0) {
    // Create default record
    await pool.query(
      'INSERT INTO confidence_data (project_id, pi_id, score) VALUES ($1, $2, $3)',
      [projectId, piId, score]
    );
  } else {
    score = parseFloat(result.rows[0].score);
  }

  // Get questions
  const questionsResult = await pool.query(
    'SELECT id, label FROM confidence_questions WHERE project_id = $1 AND pi_id = $2 ORDER BY sort_order, id',
    [projectId, piId]
  );

  // Get improvements
  const improvementsResult = await pool.query(
    'SELECT id, label FROM confidence_improvements WHERE project_id = $1 AND pi_id = $2 ORDER BY sort_order, id',
    [projectId, piId]
  );

  return {
    piId,
    projectId,
    score,
    questions: questionsResult.rows.map(row => ({ id: row.id, label: row.label })),
    improvements: improvementsResult.rows.map(row => ({ id: row.id, label: row.label })),
  };
}

// Update confidence score
export async function updateConfidenceScore(projectId: string, piId: string, score: number): Promise<void> {
  await pool.query(
    `INSERT INTO confidence_data (project_id, pi_id, score, updated_at)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
     ON CONFLICT (pi_id, project_id)
     DO UPDATE SET score = EXCLUDED.score, updated_at = CURRENT_TIMESTAMP`,
    [projectId, piId, score]
  );
}

// Add a question
export async function addConfidenceQuestion(projectId: string, piId: string, label: string): Promise<number> {
  // Ensure confidence_data record exists
  await pool.query(
    'INSERT INTO confidence_data (project_id, pi_id, score) VALUES ($1, $2, 3.0) ON CONFLICT (pi_id, project_id) DO NOTHING',
    [projectId, piId]
  );

  // Get current max sort_order
  const maxResult = await pool.query(
    'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM confidence_questions WHERE project_id = $1 AND pi_id = $2',
    [projectId, piId]
  );
  const nextOrder = maxResult.rows[0].next_order;

  const result = await pool.query(
    'INSERT INTO confidence_questions (project_id, pi_id, label, sort_order) VALUES ($1, $2, $3, $4) RETURNING id',
    [projectId, piId, label, nextOrder]
  );
  return result.rows[0].id;
}

// Delete a question
export async function deleteConfidenceQuestion(id: number): Promise<void> {
  await pool.query('DELETE FROM confidence_questions WHERE id = $1', [id]);
}

// Update a question label
export async function updateConfidenceQuestion(id: number, label: string): Promise<void> {
  await pool.query('UPDATE confidence_questions SET label = $1 WHERE id = $2', [label, id]);
}

// Add an improvement
export async function addConfidenceImprovement(projectId: string, piId: string, label: string): Promise<number> {
  // Ensure confidence_data record exists
  await pool.query(
    'INSERT INTO confidence_data (project_id, pi_id, score) VALUES ($1, $2, 3.0) ON CONFLICT (pi_id, project_id) DO NOTHING',
    [projectId, piId]
  );

  // Get current max sort_order
  const maxResult = await pool.query(
    'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM confidence_improvements WHERE project_id = $1 AND pi_id = $2',
    [projectId, piId]
  );
  const nextOrder = maxResult.rows[0].next_order;

  const result = await pool.query(
    'INSERT INTO confidence_improvements (project_id, pi_id, label, sort_order) VALUES ($1, $2, $3, $4) RETURNING id',
    [projectId, piId, label, nextOrder]
  );
  return result.rows[0].id;
}

// Delete an improvement
export async function deleteConfidenceImprovement(id: number): Promise<void> {
  await pool.query('DELETE FROM confidence_improvements WHERE id = $1', [id]);
}

// Update an improvement label
export async function updateConfidenceImprovement(id: number, label: string): Promise<void> {
  await pool.query('UPDATE confidence_improvements SET label = $1 WHERE id = $2', [label, id]);
}

// ============ PI State Management ============

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
  frozenAt: Date | null;
}

// Get PI state (creates default if doesn't exist)
export async function getPIState(projectId: string, piId: string): Promise<PIState> {
  let result = await pool.query(
    'SELECT pi_id, project_id, is_frozen, hidden_jira_keys, hidden_tasks_meta, frozen_at FROM pi_state WHERE project_id = $1 AND pi_id = $2',
    [projectId, piId]
  );

  if (result.rows.length === 0) {
    // Create default record
    await pool.query(
      'INSERT INTO pi_state (project_id, pi_id, is_frozen, hidden_jira_keys, hidden_tasks_meta) VALUES ($1, $2, FALSE, $3, $4)',
      [projectId, piId, [], {}]
    );
    return {
      piId,
      projectId,
      isFrozen: false,
      hiddenJiraKeys: [],
      hiddenTasks: [],
      frozenAt: null,
    };
  }

  const row = result.rows[0];
  const hiddenJiraKeys: string[] = row.hidden_jira_keys || [];
  const hiddenTasksMeta: Record<string, string> = row.hidden_tasks_meta || {};

  // Build hiddenTasks array with titles from meta
  const hiddenTasks: HiddenTask[] = hiddenJiraKeys.map(jiraKey => ({
    jiraKey,
    title: hiddenTasksMeta[jiraKey],
  }));

  return {
    piId: row.pi_id,
    projectId: row.project_id,
    isFrozen: row.is_frozen,
    hiddenJiraKeys,
    hiddenTasks,
    frozenAt: row.frozen_at,
  };
}

// Toggle freeze state
export async function togglePIFreeze(projectId: string, piId: string): Promise<PIState> {
  const current = await getPIState(projectId, piId);
  const newFrozenState = !current.isFrozen;
  const frozenAt = newFrozenState ? new Date() : null;

  await pool.query(
    `UPDATE pi_state
     SET is_frozen = $3, frozen_at = $4, updated_at = CURRENT_TIMESTAMP
     WHERE project_id = $1 AND pi_id = $2`,
    [projectId, piId, newFrozenState, frozenAt]
  );

  return {
    ...current,
    isFrozen: newFrozenState,
    frozenAt,
  };
}

// Add a JIRA key to hidden list
export async function hideJiraKey(projectId: string, piId: string, jiraKey: string, title?: string): Promise<HiddenTask[]> {
  // Ensure pi_state record exists
  await getPIState(projectId, piId);

  // Add to hidden_jira_keys array
  await pool.query(
    `UPDATE pi_state
     SET hidden_jira_keys = array_append(
       COALESCE(hidden_jira_keys, ARRAY[]::TEXT[]),
       $3
     ),
     updated_at = CURRENT_TIMESTAMP
     WHERE project_id = $1 AND pi_id = $2 AND NOT ($3 = ANY(COALESCE(hidden_jira_keys, ARRAY[]::TEXT[])))`,
    [projectId, piId, jiraKey]
  );

  // Store title in hidden_tasks_meta if provided
  if (title) {
    await pool.query(
      `UPDATE pi_state
       SET hidden_tasks_meta = COALESCE(hidden_tasks_meta, '{}'::JSONB) || $3::JSONB,
       updated_at = CURRENT_TIMESTAMP
       WHERE project_id = $1 AND pi_id = $2`,
      [projectId, piId, JSON.stringify({ [jiraKey]: title })]
    );
  }

  const result = await pool.query(
    'SELECT hidden_jira_keys, hidden_tasks_meta FROM pi_state WHERE project_id = $1 AND pi_id = $2',
    [projectId, piId]
  );
  const hiddenJiraKeys: string[] = result.rows[0]?.hidden_jira_keys || [];
  const hiddenTasksMeta: Record<string, string> = result.rows[0]?.hidden_tasks_meta || {};

  return hiddenJiraKeys.map(key => ({
    jiraKey: key,
    title: hiddenTasksMeta[key],
  }));
}

// Remove a JIRA key from hidden list (restore single)
export async function restoreJiraKey(projectId: string, piId: string, jiraKey: string): Promise<HiddenTask[]> {
  await pool.query(
    `UPDATE pi_state
     SET hidden_jira_keys = array_remove(COALESCE(hidden_jira_keys, ARRAY[]::TEXT[]), $3),
     hidden_tasks_meta = COALESCE(hidden_tasks_meta, '{}'::JSONB) - $3,
     updated_at = CURRENT_TIMESTAMP
     WHERE project_id = $1 AND pi_id = $2`,
    [projectId, piId, jiraKey]
  );

  const result = await pool.query(
    'SELECT hidden_jira_keys, hidden_tasks_meta FROM pi_state WHERE project_id = $1 AND pi_id = $2',
    [projectId, piId]
  );
  const hiddenJiraKeys: string[] = result.rows[0]?.hidden_jira_keys || [];
  const hiddenTasksMeta: Record<string, string> = result.rows[0]?.hidden_tasks_meta || {};

  return hiddenJiraKeys.map(key => ({
    jiraKey: key,
    title: hiddenTasksMeta[key],
  }));
}

// Restore multiple JIRA keys at once
export async function restoreJiraKeys(projectId: string, piId: string, jiraKeys: string[]): Promise<HiddenTask[]> {
  for (const key of jiraKeys) {
    await pool.query(
      `UPDATE pi_state
       SET hidden_jira_keys = array_remove(COALESCE(hidden_jira_keys, ARRAY[]::TEXT[]), $3),
       hidden_tasks_meta = COALESCE(hidden_tasks_meta, '{}'::JSONB) - $3,
       updated_at = CURRENT_TIMESTAMP
       WHERE project_id = $1 AND pi_id = $2`,
      [projectId, piId, key]
    );
  }

  const result = await pool.query(
    'SELECT hidden_jira_keys, hidden_tasks_meta FROM pi_state WHERE project_id = $1 AND pi_id = $2',
    [projectId, piId]
  );
  const hiddenJiraKeys: string[] = result.rows[0]?.hidden_jira_keys || [];
  const hiddenTasksMeta: Record<string, string> = result.rows[0]?.hidden_tasks_meta || {};

  return hiddenJiraKeys.map(key => ({
    jiraKey: key,
    title: hiddenTasksMeta[key],
  }));
}

export default pool;
