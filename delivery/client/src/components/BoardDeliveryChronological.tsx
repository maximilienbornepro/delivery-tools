import type { Sprint, Task, ProjectKey } from '../types';
import { DeviceRow } from './DeviceRow';
import { SprintColumn } from './SprintColumn';
import { TodayMarker } from './TodayMarker';
import styles from './BoardDelivery.module.css';

interface ProjectTasks {
  projectId: ProjectKey;
  tasks: Task[];
}

interface BoardDeliveryChronologicalProps {
  sprints: Sprint[];
  projectTasks: ProjectTasks[];
  piName?: string;
}

const ROW_HEIGHT = 95;
const TOTAL_COLS = 6;

// Assign rows to tasks to avoid overlapping
function assignRowsChronologically(tasks: Task[]): Task[] {
  if (tasks.length === 0) return [];

  // Sort tasks by startCol, then by endCol
  const sortedTasks = [...tasks].sort((a, b) => {
    const startDiff = (a.startCol ?? 0) - (b.startCol ?? 0);
    if (startDiff !== 0) return startDiff;
    return (a.endCol ?? 1) - (b.endCol ?? 1);
  });

  // Track which columns are occupied in each row
  const rowOccupancy: { start: number; end: number }[][] = [];

  return sortedTasks.map(task => {
    const taskStart = task.startCol ?? 0;
    const taskEnd = task.endCol ?? taskStart + 1;

    // Find first row where task fits
    let assignedRow = 0;
    for (let row = 0; row < rowOccupancy.length; row++) {
      const occupied = rowOccupancy[row];
      const hasOverlap = occupied.some(
        range => !(taskEnd <= range.start || taskStart >= range.end)
      );
      if (!hasOverlap) {
        assignedRow = row;
        break;
      }
      assignedRow = row + 1;
    }

    // Ensure row exists in occupancy array
    while (rowOccupancy.length <= assignedRow) {
      rowOccupancy.push([]);
    }

    // Mark this task's columns as occupied
    rowOccupancy[assignedRow].push({ start: taskStart, end: taskEnd });

    return { ...task, row: assignedRow };
  });
}

// Extract PI name from sprint name (e.g., "S1 PI 1 2026" -> "PI 1 2026")
function extractPiName(sprintName: string): string {
  const match = sprintName.match(/PI\s+\d+\s+\d{4}/i);
  return match ? match[0] : '';
}

export function BoardDeliveryChronological({ sprints, projectTasks, piName }: BoardDeliveryChronologicalProps) {
  // Merge all tasks from all projects, adding projectId to each task
  const allTasks: Task[] = projectTasks.flatMap(({ projectId, tasks }) =>
    tasks.map(task => ({ ...task, projectId }))
  );

  // Assign rows chronologically to avoid overlapping
  const tasksWithRows = assignRowsChronologically(allTasks);

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

        <DeviceRow
          label="Tous"
          tasks={tasksWithRows}
          totalCols={TOTAL_COLS}
          rowHeight={ROW_HEIGHT}
          readOnly={true}
        />
      </div>
    </div>
  );
}
