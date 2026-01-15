import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import styles from './HomePage.module.css';

export function HomePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || !userName.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { room, participant } = await api.createRoom(roomName, userName);
      localStorage.setItem('participantId', participant.id);
      localStorage.setItem('participantName', userName);
      navigate(`/room/${room.code}`);
    } catch {
      setError('Erreur lors de la création de la room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim() || !userName.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { room, participant } = await api.joinRoom(roomCode.toUpperCase(), userName);
      localStorage.setItem('participantId', participant.id);
      localStorage.setItem('participantName', userName);
      navigate(`/room/${room.code}`);
    } catch {
      setError('Room introuvable ou erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img src="/francetv-logo.svg" alt="France.tv" className={styles.logo} />
        <h1 className={styles.title}>Pointing Poker</h1>
        <p className={styles.subtitle}>Estimez vos tâches en équipe</p>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'create' ? styles.active : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Créer une room
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'join' ? styles.active : ''}`}
            onClick={() => setActiveTab('join')}
          >
            Rejoindre
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {activeTab === 'create' ? (
          <form onSubmit={handleCreateRoom} className={styles.form}>
            <input
              type="text"
              placeholder="Nom de la room"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className={styles.input}
            />
            <input
              type="text"
              placeholder="Votre nom"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className={styles.input}
            />
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? 'Création...' : 'Créer la room'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoinRoom} className={styles.form}>
            <input
              type="text"
              placeholder="Code de la room"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className={styles.input}
              maxLength={6}
            />
            <input
              type="text"
              placeholder="Votre nom"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className={styles.input}
            />
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? 'Connexion...' : 'Rejoindre'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
