import type { Sprint, Task, Release, ProjectKey } from '../types';
import { PROJECTS } from '../types';
import { DeviceRow } from './DeviceRow';
import { SprintColumn } from './SprintColumn';
import { MepMarker } from './MepMarker';
import { TodayMarker } from './TodayMarker';
import styles from './BoardDelivery.module.css';

interface BoardDeliveryProps {
  sprints: Sprint[];
  tasks: Task[];
  releases: Release[];
  projectLabel: string;
  piName?: string;
  readOnly?: boolean;
  showMepMarkers?: boolean;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskResize?: (taskId: string, newStartCol: number, newEndCol: number) => void;
  onTaskMove?: (taskId: string, newStartCol: number, newRow: number) => void;
}

const ROW_HEIGHT = 95;
const TOTAL_COLS = 6;

// Extract PI name from sprint name (e.g., "S1 PI 1 2026" -> "PI 1 2026")
function extractPiName(sprintName: string): string {
  const match = sprintName.match(/PI\s+\d+\s+\d{4}/i);
  return match ? match[0] : '';
}

export function BoardDelivery({
  sprints,
  tasks,
  releases,
  projectLabel,
  piName,
  readOnly = false,
  showMepMarkers = true,
  onTaskUpdate,
  onTaskDelete,
  onTaskResize,
  onTaskMove,
}: BoardDeliveryProps) {
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
        {/* MEP Markers + Today Marker */}
        {showMepMarkers && (
          <div className={styles.mepLayer}>
            <TodayMarker sprints={sprints} totalCols={TOTAL_COLS} />
            {releases.map((release) => (
              <MepMarker
                key={release.id}
                release={release}
                sprints={sprints}
                totalCols={TOTAL_COLS}
              />
            ))}
          </div>
        )}

        <DeviceRow
          label={projectLabel}
          tasks={PROJECTS.includes(projectLabel as ProjectKey)
            ? tasks.map(task => ({ ...task, projectId: projectLabel as ProjectKey }))
            : tasks
          }
          totalCols={TOTAL_COLS}
          rowHeight={ROW_HEIGHT}
          readOnly={readOnly}
          onTaskUpdate={onTaskUpdate}
          onTaskDelete={onTaskDelete}
          onTaskResize={onTaskResize}
          onTaskMove={onTaskMove}
        />
      </div>
    </div>
  );
}
