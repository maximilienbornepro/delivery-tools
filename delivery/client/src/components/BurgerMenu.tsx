import { useState } from 'react';
import type { Sprint } from '../types';
import styles from './BurgerMenu.module.css';

interface PI {
  id: string;
  name: string;
  sprints: Sprint[];
}

interface BurgerMenuProps {
  selectedPI: string;
  onSelectPI: (piId: string) => void;
  piList: PI[];
}

export function BurgerMenu({ selectedPI, onSelectPI, piList }: BurgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className={styles.burgerButton}
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
      >
        <span className={styles.burgerIcon}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      <div className={`${styles.menu} ${isOpen ? styles.open : ''}`}>
        <div className={styles.menuHeader}>
          <h3>Programme Increments</h3>
          <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>×</button>
        </div>

        <div className={styles.piList}>
          {piList.map((pi) => (
            <button
              key={pi.id}
              className={`${styles.piItem} ${selectedPI === pi.id ? styles.selected : ''}`}
              onClick={() => {
                onSelectPI(pi.id);
                setIsOpen(false);
              }}
            >
              <span className={styles.piName}>{pi.name}</span>
              <span className={styles.piDates}>
                {pi.sprints[0].startDate.split('-').slice(1).join('/')} - {pi.sprints[2].endDate.split('-').slice(1).join('/')}
              </span>
            </button>
          ))}
        </div>
      </div>

      {isOpen && <div className={styles.overlay} onClick={() => setIsOpen(false)} />}
    </>
  );
}

// Generate all PIs for 2026
export function generatePIs2026(): PI[] {
  const pis: PI[] = [];
  let currentDate = new Date('2026-01-19');

  for (let piNum = 1; piNum <= 8; piNum++) {
    const sprints: Sprint[] = [];

    for (let sprintNum = 1; sprintNum <= 3; sprintNum++) {
      const startDate = new Date(currentDate);
      const endDate = new Date(currentDate);
      endDate.setDate(endDate.getDate() + 13); // 2 weeks - 1 day

      sprints.push({
        id: `pi${piNum}-s${sprintNum}`,
        name: `S${sprintNum} PI ${piNum} 2026`,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      currentDate.setDate(currentDate.getDate() + 14); // Move to next sprint
    }

    pis.push({
      id: `pi${piNum}`,
      name: `PI ${piNum} 2026`,
      sprints,
    });
  }

  return pis;
}
