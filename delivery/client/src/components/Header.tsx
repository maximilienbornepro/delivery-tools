import styles from './Header.module.css';

interface HeaderProps {
  activeTab: 'AND' | 'IOS';
  onTabChange: (tab: 'AND' | 'IOS') => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'AND' ? styles.active : ''}`}
          onClick={() => onTabChange('AND')}
        >
          APP (AND)
        </button>
        <button
          className={`${styles.tab} ${styles.boardTab} ${activeTab === 'AND' ? styles.active : ''}`}
        >
          BOARD DELIVERY
        </button>
      </div>
    </header>
  );
}
