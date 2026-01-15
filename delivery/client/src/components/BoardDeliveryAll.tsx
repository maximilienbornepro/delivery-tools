import type { Sprint, Task, ProjectKey } from '../types';
import { PROJECTS } from '../types';
import { DeviceRow } from './DeviceRow';
import { SprintColumn } from './SprintColumn';
import { TodayMarker } from './TodayMarker';
import styles from './BoardDelivery.module.css';

interface ProjectTasks {
  projectId: ProjectKey;
  tasks: Task[];
}

interface BoardDeliveryAllProps {
  sprints: Sprint[];
  projectTasks: ProjectTasks[];
  piName?: string;
}

const ROW_HEIGHT = 95;
const TOTAL_COLS = 6;

// Get display label for project
function getProjectDisplayName(projectId: ProjectKey): string {
  const names: Record<ProjectKey, string> = {
    TVSMART: 'Smart TV',
    TVFREE: 'Freebox',
    TVORA: 'Orange',
    TVSFR: 'SFR',
    TVFIRE: 'Fire TV',
  };
  return names[projectId] || projectId;
}

// Extract PI name from sprint name (e.g., "S1 PI 1 2026" -> "PI 1 2026")
function extractPiName(sprintName: string): string {
  const match = sprintName.match(/PI\s+\d+\s+\d{4}/i);
  return match ? match[0] : '';
}

export function BoardDeliveryAll({ sprints, projectTasks, piName }: BoardDeliveryAllProps) {
  // Sort projects in PROJECTS order
  const sortedProjectTasks = [...projectTasks].sort((a, b) => {
    return PROJECTS.indexOf(a.projectId) - PROJECTS.indexOf(b.projectId);
  });

  const displayPiName = piName || (sprints.length > 0 ? extractPiName(sprints[0].name) : '');

  return (
    <div className={styles.board}>
      {displayPiName && (
        <div className={styles.piHeader}>
          <span className={styles.piName}>{displayPiName}</span>
        </div>
      )}
      <div className={styles.sprintHeader}>
        <div className={styles.platformLabel}></div>
        {sprints.map((sprint) => (
          <SprintColumn key={sprint.id} sprint={sprint} />
        ))}
      </div>

      <div className={styles.boardContent}>
        {/* Today Marker */}
        <div className={styles.mepLayer}>
          <TodayMarker sprints={sprints} totalCols={TOTAL_COLS} />
        </div>

        {sortedProjectTasks.map(({ projectId, tasks }) => (
          <DeviceRow
            key={projectId}
            label={getProjectDisplayName(projectId)}
            tasks={tasks.map(task => ({ ...task, projectId }))}
            totalCols={TOTAL_COLS}
            rowHeight={ROW_HEIGHT}
            readOnly={true}
          />
        ))}
      </div>
    </div>
  );
}
