import { useState } from 'react';
import styles from './JoinRoomForm.module.css';

interface JoinRoomFormProps {
  roomName: string;
  onJoin: (name: string) => void;
  loading?: boolean;
}

export function JoinRoomForm({ roomName, onJoin, loading }: JoinRoomFormProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onJoin(name.trim());
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img src="/francetv-logo.svg" alt="France.tv" className={styles.logo} />
        <h1 className={styles.title}>Pointing Poker</h1>
        <p className={styles.subtitle}>Rejoindre la room</p>
        <p className={styles.roomName}>{roomName}</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="name" className={styles.label}>Votre nom</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Entrez votre nom"
              className={styles.input}
              autoFocus
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={!name.trim() || loading}
          >
            {loading ? 'Connexion...' : 'Rejoindre'}
          </button>
        </form>
      </div>
    </div>
  );
}
