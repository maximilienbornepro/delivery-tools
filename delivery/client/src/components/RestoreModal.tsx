import { useState } from 'react';
import styles from './RestoreModal.module.css';

interface HiddenTask {
  jiraKey: string;
  title?: string;
}

interface RestoreModalProps {
  hiddenTasks: HiddenTask[];
  onRestore: (jiraKeys: string[]) => void;
  onClose: () => void;
}

export function RestoreModal({ hiddenTasks, onRestore, onClose }: RestoreModalProps) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const toggleSelection = (jiraKey: string) => {
    const newSelection = new Set(selectedKeys);
    if (newSelection.has(jiraKey)) {
      newSelection.delete(jiraKey);
    } else {
      newSelection.add(jiraKey);
    }
    setSelectedKeys(newSelection);
  };

  const selectAll = () => {
    setSelectedKeys(new Set(hiddenTasks.map(t => t.jiraKey)));
  };

  const deselectAll = () => {
    setSelectedKeys(new Set());
  };

  const handleRestore = () => {
    if (selectedKeys.size > 0) {
      onRestore(Array.from(selectedKeys));
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Restaurer des tickets masques</h3>
          <button className={styles.closeBtn} onClick={onClose}>x</button>
        </div>

        <div className={styles.actions}>
          <button className={styles.selectBtn} onClick={selectAll}>Tout selectionner</button>
          <button className={styles.selectBtn} onClick={deselectAll}>Tout deselectionner</button>
        </div>

        <div className={styles.list}>
          {hiddenTasks.map((task) => (
            <label key={task.jiraKey} className={styles.item}>
              <input
                type="checkbox"
                checked={selectedKeys.has(task.jiraKey)}
                onChange={() => toggleSelection(task.jiraKey)}
              />
              <a
                href={`https://francetv.atlassian.net/browse/${task.jiraKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.jiraLink}
                onClick={(e) => e.stopPropagation()}
              >
                {task.jiraKey}
              </a>
              {task.title && <span className={styles.title}>{task.title}</span>}
            </label>
          ))}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Annuler
          </button>
          <button
            className={styles.restoreBtn}
            onClick={handleRestore}
            disabled={selectedKeys.size === 0}
          >
            Restaurer ({selectedKeys.size})
          </button>
        </div>
      </div>
    </div>
  );
}
