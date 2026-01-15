import { useEffect } from 'react';
import styles from './Notification.module.css';

export interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  details?: string;
}

interface NotificationProps {
  notification: NotificationData;
  onClose: (id: string) => void;
}

export function Notification({ notification, onClose }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  return (
    <div className={`${styles.notification} ${styles[notification.type]}`}>
      <div className={styles.content}>
        <span className={styles.icon}>
          {notification.type === 'success' && '✓'}
          {notification.type === 'error' && '✕'}
          {notification.type === 'info' && 'ℹ'}
        </span>
        <div className={styles.text}>
          <p className={styles.message}>{notification.message}</p>
          {notification.details && (
            <p className={styles.details}>{notification.details}</p>
          )}
        </div>
      </div>
      <button className={styles.close} onClick={() => onClose(notification.id)}>
        ×
      </button>
    </div>
  );
}

interface NotificationContainerProps {
  notifications: NotificationData[];
  onClose: (id: string) => void;
}

export function NotificationContainer({ notifications, onClose }: NotificationContainerProps) {
  if (notifications.length === 0) return null;

  return (
    <div className={styles.container}>
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={onClose}
        />
      ))}
    </div>
  );
}
