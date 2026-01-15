-- Connect to delivery database
\c delivery;

-- Table pour stocker les positions des taches par projet + PI
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
);

-- Index pour ameliorer les performances des requetes
CREATE INDEX IF NOT EXISTS idx_task_positions_pi ON task_positions(pi_id);
CREATE INDEX IF NOT EXISTS idx_task_positions_task ON task_positions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_positions_project ON task_positions(project_id);

-- Table pour stocker les donnees de confiance par projet + PI
CREATE TABLE IF NOT EXISTS confidence_data (
    id SERIAL PRIMARY KEY,
    pi_id VARCHAR(20) NOT NULL,
    project_id VARCHAR(20) NOT NULL DEFAULT 'TVSMART',
    score DECIMAL(3,1) NOT NULL DEFAULT 3.0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pi_id, project_id)
);

-- Table pour les questions/risques de confiance
CREATE TABLE IF NOT EXISTS confidence_questions (
    id SERIAL PRIMARY KEY,
    pi_id VARCHAR(20) NOT NULL,
    project_id VARCHAR(20) NOT NULL DEFAULT 'TVSMART',
    label VARCHAR(255) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les ameliorations suggerees
CREATE TABLE IF NOT EXISTS confidence_improvements (
    id SERIAL PRIMARY KEY,
    pi_id VARCHAR(20) NOT NULL,
    project_id VARCHAR(20) NOT NULL DEFAULT 'TVSMART',
    label VARCHAR(255) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_confidence_questions_pi ON confidence_questions(pi_id);
CREATE INDEX IF NOT EXISTS idx_confidence_questions_project ON confidence_questions(project_id);
CREATE INDEX IF NOT EXISTS idx_confidence_improvements_pi ON confidence_improvements(pi_id);
CREATE INDEX IF NOT EXISTS idx_confidence_improvements_project ON confidence_improvements(project_id);

-- Table pour l'etat des PI par projet (freeze/hidden tickets)
CREATE TABLE IF NOT EXISTS pi_state (
    id SERIAL PRIMARY KEY,
    pi_id VARCHAR(20) NOT NULL,
    project_id VARCHAR(20) NOT NULL DEFAULT 'TVSMART',
    is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
    hidden_jira_keys TEXT[] DEFAULT ARRAY[]::TEXT[],
    frozen_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pi_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_pi_state_pi ON pi_state(pi_id);
CREATE INDEX IF NOT EXISTS idx_pi_state_project ON pi_state(project_id);
