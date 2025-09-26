import { io } from 'socket.io-client';

// Backend server URL - permanent deployment
const BACKEND_URL = 'https://0vhlizcgwjeq.manus.space';

class SocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    this.socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.socket.on('connect', () => {
      console.log('Connected to server:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Game room methods
  createRoom(hostId, hostUsername, gameCode, settings = {}) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Not connected to server'));
        return;
      }

      this.socket.emit('createRoom', {
        hostId,
        hostUsername,
        gameCode,
        settings
      });

      this.socket.once('roomCreated', (data) => {
        if (data.success) {
          resolve(data.room);
        } else {
          reject(new Error(data.error));
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Room creation timeout'));
      }, 10000);
    });
  }

  joinRoom(gameCode, playerId, playerUsername) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Not connected to server'));
        return;
      }

      this.socket.emit('joinRoom', {
        gameCode,
        playerId,
        playerUsername
      });

      this.socket.once('roomJoined', (data) => {
        if (data.success) {
          resolve(data.room);
        } else {
          reject(new Error(data.error));
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Room join timeout'));
      }, 10000);
    });
  }

  leaveRoom(gameCode, playerId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leaveRoom', { gameCode, playerId });
    }
  }

  updatePlayerReady(gameCode, playerId, isReady) {
    if (this.socket && this.isConnected) {
      this.socket.emit('playerReady', { gameCode, playerId, isReady });
    }
  }

  startGame(gameCode) {
    if (this.socket && this.isConnected) {
      this.socket.emit('startGame', { gameCode });
    }
  }

  makeMove(gameCode, playerId, move) {
    if (this.socket && this.isConnected) {
      this.socket.emit('gameMove', { gameCode, playerId, move });
    }
  }

  sendChatMessage(gameCode, playerId, playerUsername, message) {
    if (this.socket && this.isConnected) {
      this.socket.emit('chatMessage', {
        gameCode,
        playerId,
        playerUsername,
        message
      });
    }
  }

  // Event listeners
  onRoomUpdate(callback) {
    if (this.socket) {
      this.socket.on('roomUpdate', callback);
    }
  }

  onGameUpdate(callback) {
    if (this.socket) {
      this.socket.on('gameUpdate', callback);
    }
  }

  onChatMessage(callback) {
    if (this.socket) {
      this.socket.on('chatMessage', callback);
    }
  }

  onPlayerJoined(callback) {
    if (this.socket) {
      this.socket.on('playerJoined', callback);
    }
  }

  onPlayerLeft(callback) {
    if (this.socket) {
      this.socket.on('playerLeft', callback);
    }
  }

  onGameStarted(callback) {
    if (this.socket) {
      this.socket.on('gameStarted', callback);
    }
  }

  onError(callback) {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }

  // Remove listeners
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Get connection status
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }
}

// Create singleton instance
const socketClient = new SocketClient();

export default socketClient;
