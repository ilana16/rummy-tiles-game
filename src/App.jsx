import React, { useState, useEffect } from 'react';
import { GameProvider, useGame } from './contexts/GameContext.jsx';
import { signInUser, signOutUser, onAuthStateChange } from './lib/simpleAuth.js';
import LoginScreen from './components/LoginScreen.jsx';
import MainMenu from './components/MainMenu.jsx';
import GameRoom from './components/GameRoom.jsx';
import GameBoard from './components/GameBoard.jsx';
import './App.css';

function AppContent() {
  const { user, roomState, gameState, loading, error } = useGame();
  const [currentScreen, setCurrentScreen] = useState('login');
  const [username, setUsername] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        setCurrentScreen('menu');
      } else {
        setCurrentScreen('login');
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (roomState) {
      if (roomState.gameState === 'playing' && gameState) {
        setCurrentScreen('game');
      } else if (roomState.gameState === 'waiting') {
        setCurrentScreen('room');
      }
    }
  }, [roomState, gameState]);

  const handleLogin = async (enteredUsername) => {
    try {
      await signInUser(enteredUsername);
      setUsername(enteredUsername);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      setCurrentScreen('login');
      setUsername('');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <LoginScreen onLogin={handleLogin} loading={loading} error={error} />;
      case 'menu':
        return <MainMenu username={username} onLogout={handleLogout} onScreenChange={setCurrentScreen} />;
      case 'room':
        return <GameRoom onScreenChange={setCurrentScreen} />;
      case 'game':
        return <GameBoard onScreenChange={setCurrentScreen} />;
      default:
        return <LoginScreen onLogin={handleLogin} loading={loading} error={error} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {renderCurrentScreen()}
    </div>
  );
}

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

export default App;
