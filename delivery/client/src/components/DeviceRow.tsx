import type { Task } from '../types';
import { TaskBlock } from './TaskBlock';
import styles from './DeviceRow.module.css';

interface DeviceRowProps {
  label: string;
  tasks: Task[];
  totalCols: number;
  rowHeight: number;
  readOnly?: boolean;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskResize?: (taskId: string, newStartCol: number, newEndCol: number) => void;
  onTaskMove?: (taskId: string, newStartCol: number, newRow: number) => void;
}

export function DeviceRow({
  label,
  tasks,
  totalCols,
  rowHeight,
  readOnly = false,
  onTaskUpdate,
  onTaskDelete,
  onTaskResize,
  onTaskMove,
}: DeviceRowProps) {
  const maxRow = Math.max(0, ...tasks.map((t) => t.row ?? 0));
  const minHeight = (maxRow + 1) * (rowHeight + 10) + 20;

  return (
    <div className={styles.deviceRow}>
      <div className={styles.deviceLabel}>
        <span>{label}</span>
      </div>
      <div className={styles.timeline} style={{ minHeight }}>
        {tasks.map((task) => (
          <TaskBlock
            key={task.id}
            task={task}
            totalCols={totalCols}
            rowHeight={rowHeight}
            readOnly={readOnly}
            onUpdate={readOnly ? undefined : onTaskUpdate}
            onDelete={readOnly ? undefined : onTaskDelete}
            onResize={readOnly ? undefined : onTaskResize}
            onMove={readOnly ? undefined : onTaskMove}
          />
        ))}

        {/* Sprint dividers */}
        {Array.from({ length: totalCols - 1 }, (_, i) => (
          <div
            key={i}
            className={styles.sprintDivider}
            style={{ left: `${((i + 1) / totalCols) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}
