import { useState, useRef, useCallback } from 'react';
import type { Task, Platform, ProjectKey } from '../types';
import styles from './TaskBlock.module.css';

interface TaskBlockProps {
  task: Task;
  totalCols: number;
  rowHeight: number;
  readOnly?: boolean;
  projectBadge?: string;
  projectColor?: string;
  onUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
  onResize?: (taskId: string, newStartCol: number, newEndCol: number) => void;
  onMove?: (taskId: string, newStartCol: number, newRow: number, newPlatform?: Platform) => void;
}

// Get color based on project ID (for chronological view)
const getProjectColor = (projectId?: ProjectKey): string | null => {
  if (!projectId) return null;
  const colors: Record<ProjectKey, string> = {
    TVSMART: '#dbeafe', // light blue
    TVFREE: '#f3f4f6',  // light gray
    TVORA: '#ffedd5',   // light orange
    TVSFR: '#fee2e2',   // light red
    TVFIRE: '#fef9c3',  // light yellow
  };
  return colors[projectId] || null;
};

// Get badge color based on project ID
const getJiraBadgeColor = (projectId?: ProjectKey): { background: string; color: string } => {
  if (!projectId) return { background: '#667eea', color: '#fff' }; // default purple
  const colors: Record<ProjectKey, { background: string; color: string }> = {
    TVSMART: { background: '#3b82f6', color: '#fff' },  // blue
    TVFREE: { background: '#1f2937', color: '#fff' },   // black
    TVORA: { background: '#f97316', color: '#fff' },    // orange
    TVSFR: { background: '#dc2626', color: '#fff' },    // red
    TVFIRE: { background: '#eab308', color: '#000' },   // yellow
  };
  return colors[projectId] || { background: '#667eea', color: '#fff' };
};

const getTaskColor = (task: Task): string => {
  // If task has projectId, use project color
  const projectColor = getProjectColor(task.projectId);
  if (projectColor) return projectColor;

  if (task.type === 'tech' && task.title.includes('Réduction dette')) {
    return '#fbbf24';
  }
  if (task.isRetourGoogle) {
    return '#fbbf24';
  }
  if (task.type === 'player') {
    return '#fef3c7';
  }
  if (task.type === 'feature') {
    return '#fef9c3';
  }
  return '#fef9c3';
};

// Map JIRA status to display label and CSS class
const getStatusInfo = (jiraStatus?: string): { label: string; className: string } | null => {
  if (!jiraStatus) return null;

  const statusLower = jiraStatus.toLowerCase();

  if (statusLower.includes('cadrage') || statusLower.includes('a cadrer')) {
    return { label: 'Cadrage', className: styles.statusCadrage };
  }
  if (statusLower.includes('refinement') || statusLower.includes('affinage')) {
    return { label: 'Refinement', className: styles.statusRefinement };
  }
  if (statusLower.includes('en cours') || statusLower.includes('in progress')) {
    return { label: 'En cours', className: styles.statusEnCours };
  }
  if (statusLower.includes('bloqu') || statusLower.includes('block')) {
    return { label: 'Bloqué', className: styles.statusBloque };
  }
  if (statusLower.includes('a faire') || statusLower.includes('à faire') || statusLower.includes('to do')) {
    return { label: 'À faire', className: styles.statusAFaire };
  }
  if (statusLower.includes('backlog')) {
    return { label: 'Backlog', className: styles.statusBacklog };
  }
  if (statusLower.includes('done') || statusLower.includes('terminé') || statusLower.includes('livr')) {
    return { label: 'Done', className: styles.statusDone };
  }

  // Default: show the raw status
  return { label: jiraStatus, className: styles.statusAFaire };
};

export function TaskBlock({ task, totalCols, rowHeight, readOnly = false, projectBadge, projectColor, onUpdate, onDelete, onResize, onMove }: TaskBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const blockRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startColRef = useRef({ start: 0, end: 0 });
  const startRowRef = useRef(0);

  const startCol = task.startCol ?? 0;
  const endCol = task.endCol ?? startCol + 1;
  const row = task.row ?? 0;
  const taskWidth = endCol - startCol;
  const width = (taskWidth / totalCols) * 100;
  const left = (startCol / totalCols) * 100;

  // Remove ticket number from title (e.g., "TVSMART-1234 - Title" -> "Title")
  const cleanTitle = task.title.replace(/^[A-Z]+-\d+\s*-\s*/, '');
  const jiraUrl = task.jiraKey ? `https://francetv.atlassian.net/browse/${task.jiraKey}` : null;
  const statusInfo = getStatusInfo(task.jiraStatus);

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isDragging || readOnly) return;
    e.stopPropagation();
    setIsEditing(true);
    setEditedTitle(task.title);
  };

  const handleSaveTitle = () => {
    if (editedTitle.trim() && editedTitle !== task.title && onUpdate) {
      onUpdate(task.id, { title: editedTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setEditedTitle(task.title);
      setIsEditing(false);
    }
  };

  const handleResizeStart = useCallback((e: React.MouseEvent, direction: 'left' | 'right') => {
    if (readOnly || !onResize) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(direction);
    startXRef.current = e.clientX;
    startColRef.current = { start: startCol, end: endCol };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!blockRef.current?.parentElement) return;

      const parentWidth = blockRef.current.parentElement.offsetWidth;
      const colWidth = parentWidth / totalCols;
      const deltaX = moveEvent.clientX - startXRef.current;
      const deltaCols = Math.round(deltaX / colWidth);

      if (direction === 'right') {
        const newEndCol = Math.max(startColRef.current.start + 1, Math.min(totalCols, startColRef.current.end + deltaCols));
        if (newEndCol !== endCol) {
          onResize(task.id, startColRef.current.start, newEndCol);
        }
      } else {
        const newStartCol = Math.max(0, Math.min(startColRef.current.end - 1, startColRef.current.start + deltaCols));
        if (newStartCol !== startCol) {
          onResize(task.id, newStartCol, startColRef.current.end);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [readOnly, startCol, endCol, totalCols, task.id, onResize]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    // Don't start drag if clicking on resize handles, editing, or readOnly
    if (isEditing || isResizing || readOnly || !onMove) return;

    const target = e.target as HTMLElement;
    if (target.closest(`.${styles.resizeHandle}`) || target.closest(`.${styles.deleteBtn}`)) {
      return;
    }

    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    startColRef.current = { start: startCol, end: endCol };
    startRowRef.current = row;
    setDragOffset({ x: 0, y: 0 });

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startXRef.current;
      const deltaY = moveEvent.clientY - startYRef.current;
      setDragOffset({ x: deltaX, y: deltaY });
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      if (!blockRef.current?.parentElement) return;

      const parentWidth = blockRef.current.parentElement.offsetWidth;
      const colWidth = parentWidth / totalCols;

      const deltaX = upEvent.clientX - startXRef.current;
      const deltaY = upEvent.clientY - startYRef.current;

      const deltaCols = Math.round(deltaX / colWidth);
      const deltaRows = Math.round(deltaY / rowHeight);

      // Calculate new position with snap to grid
      const newStartCol = Math.max(0, Math.min(totalCols - taskWidth, startColRef.current.start + deltaCols));
      const newRow = Math.max(0, startRowRef.current + deltaRows);

      // Only update if position changed
      if (newStartCol !== startCol || newRow !== row) {
        onMove(task.id, newStartCol, newRow);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isEditing, isResizing, readOnly, startCol, endCol, row, totalCols, rowHeight, task.id, taskWidth, onMove]);

  return (
    <div
      ref={blockRef}
      className={`${styles.taskBlock} ${task.isRetourGoogle ? styles.retourGoogle : ''} ${isResizing ? styles.resizing : ''} ${isDragging ? styles.dragging : ''}`}
      style={{
        left: `${left}%`,
        width: `${width}%`,
        top: `${20 + row * rowHeight}px`,
        background: projectColor || getTaskColor(task),
        transform: isDragging ? `translate(${dragOffset.x}px, ${dragOffset.y}px)` : undefined,
      }}
      onMouseEnter={() => !isDragging && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleDragStart}
    >
      {/* Left resize handle */}
      {!readOnly && (
        <div
          className={`${styles.resizeHandle} ${styles.resizeLeft}`}
          onMouseDown={(e) => handleResizeStart(e, 'left')}
        />
      )}

      {/* Content */}
      <div className={styles.content}>
        {task.isRetourGoogle && (
          <span className={styles.retourLabel}>RETOUR GOOGLE</span>
        )}

        {/* Project Badge (for chronological view) */}
        {projectBadge && (
          <span className={styles.projectBadge}>{projectBadge}</span>
        )}

        {/* JIRA Key Label */}
        {jiraUrl && (
          <a
            href={jiraUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.jiraLabel}
            style={getJiraBadgeColor(task.projectId)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            title={`Ouvrir ${task.jiraKey} dans JIRA`}
          >
            {task.jiraKey}
          </a>
        )}
        {/* Estimated Days */}
        {task.estimatedDays && (
          <>
            <span className={styles.separator}>-</span>
            <span className={styles.daysBadge}>{task.estimatedDays}j</span>
          </>
        )}

        {task.type === 'player' && (
          <span className={styles.playerBadge}>PLAYER</span>
        )}
        {cleanTitle.includes('API') && (
          <span className={styles.apiBadge}>API PRD</span>
        )}

        {isEditing ? (
          <input
            type="text"
            className={styles.editInput}
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <span className={styles.taskTitle}>{cleanTitle}</span>
        )}

        {task.status === 'done' && !isEditing && (
          <span className={styles.checkmark}>✓</span>
        )}
      </div>

      {/* Status badge - top right */}
      {statusInfo && (
        <span
          className={`${styles.statusBadge} ${statusInfo.className}`}
          title={`Statut: ${task.jiraStatus}`}
        >
          {statusInfo.label}
        </span>
      )}


      {/* Version badge */}
      {task.fixVersion && (
        <span className={styles.versionBadge} title={`Version: ${task.fixVersion}`}>
          {task.fixVersion}
        </span>
      )}

      {/* Delete button */}
      {isHovered && !isEditing && !isDragging && !readOnly && onDelete && (
        <button
          className={styles.deleteBtn}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title="Supprimer"
        >
          ×
        </button>
      )}

      {/* Right resize handle */}
      {!readOnly && (
        <div
          className={`${styles.resizeHandle} ${styles.resizeRight}`}
          onMouseDown={(e) => handleResizeStart(e, 'right')}
        />
      )}
    </div>
  );
}
