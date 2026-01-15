import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { RoomProvider } from './context/RoomContext';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SocketProvider>
        <RoomProvider>
          <App />
        </RoomProvider>
      </SocketProvider>
    </BrowserRouter>
  </React.StrictMode>
);
