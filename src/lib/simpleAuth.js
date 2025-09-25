// Simplified authentication system for testing without Firebase
import { v4 as uuidv4 } from 'uuid';

class SimpleAuth {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
  }

  // Simulate Firebase auth state change
  onAuthStateChanged(callback) {
    this.listeners.push(callback);
    
    // Check for existing user in localStorage
    const savedUser = localStorage.getItem('rummy_user');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      callback(this.currentUser);
    } else {
      callback(null);
    }

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Simulate anonymous sign in
  async signInAnonymously(username) {
    const user = {
      uid: uuidv4(),
      username: username,
      isAnonymous: true,
      createdAt: new Date().toISOString()
    };

    this.currentUser = user;
    localStorage.setItem('rummy_user', JSON.stringify(user));

    // Notify listeners
    this.listeners.forEach(callback => callback(user));

    return { user };
  }

  // Sign out
  async signOut() {
    this.currentUser = null;
    localStorage.removeItem('rummy_user');
    
    // Notify listeners
    this.listeners.forEach(callback => callback(null));
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }
}

// Create singleton instance
const simpleAuth = new SimpleAuth();

// Simple in-memory game storage
class SimpleGameStorage {
  constructor() {
    this.games = new Map();
    this.listeners = new Map();
  }

  // Create game room
  async createGameRoom(hostId, hostUsername, gameCode) {
    const gameData = {
      id: gameCode,
      hostId: hostId,
      hostUsername: hostUsername,
      players: [{
        id: hostId,
        username: hostUsername,
        isReady: false,
        isHost: true
      }],
      gameState: 'waiting',
      isPrivate: true,
      createdAt: new Date(),
      maxPlayers: 4,
      settings: {
        aiDifficulty: 'medium',
        allowSpectators: false
      },
      chat: []
    };
    
    this.games.set(gameCode, gameData);
    this.notifyListeners(gameCode, gameData);
    return gameData;
  }

  // Join game room
  async joinGameRoom(gameCode, playerId, playerUsername) {
    const gameData = this.games.get(gameCode);
    if (!gameData) {
      throw new Error('Game room not found');
    }
    
    if (gameData.players.length >= gameData.maxPlayers) {
      throw new Error('Game room is full');
    }
    
    if (gameData.gameState !== 'waiting') {
      throw new Error('Game has already started');
    }
    
    // Check if player is already in the game
    const existingPlayer = gameData.players.find(p => p.id === playerId);
    if (existingPlayer) {
      return gameData;
    }
    
    gameData.players.push({
      id: playerId,
      username: playerUsername,
      isReady: false,
      isHost: false
    });
    
    this.games.set(gameCode, gameData);
    this.notifyListeners(gameCode, gameData);
    return gameData;
  }

  // Update player ready status
  async updatePlayerReady(gameCode, playerId, isReady) {
    const gameData = this.games.get(gameCode);
    if (!gameData) {
      throw new Error('Game room not found');
    }
    
    const player = gameData.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }
    
    player.isReady = isReady;
    this.games.set(gameCode, gameData);
    this.notifyListeners(gameCode, gameData);
    return gameData.players;
  }

  // Start game
  async startGame(gameCode, gameState) {
    const gameData = this.games.get(gameCode);
    if (!gameData) {
      throw new Error('Game room not found');
    }
    
    gameData.gameState = 'playing';
    gameData.gameData = gameState;
    gameData.startedAt = new Date();
    
    this.games.set(gameCode, gameData);
    this.notifyListeners(gameCode, gameData);
  }

  // Update game state
  async updateGameState(gameCode, gameState) {
    const gameData = this.games.get(gameCode);
    if (!gameData) {
      throw new Error('Game room not found');
    }
    
    gameData.gameData = gameState;
    gameData.lastUpdated = new Date();
    
    this.games.set(gameCode, gameData);
    this.notifyListeners(gameCode, gameData);
  }

  // Add chat message
  async addChatMessage(gameCode, playerId, playerUsername, message) {
    const gameData = this.games.get(gameCode);
    if (!gameData) {
      throw new Error('Game room not found');
    }
    
    const chatMessage = {
      id: Date.now().toString(),
      playerId,
      playerUsername,
      message,
      timestamp: new Date()
    };
    
    gameData.chat = [...(gameData.chat || []), chatMessage];
    this.games.set(gameCode, gameData);
    this.notifyListeners(gameCode, gameData);
    return chatMessage;
  }

  // Leave game room
  async leaveGameRoom(gameCode, playerId) {
    const gameData = this.games.get(gameCode);
    if (!gameData) {
      return;
    }
    
    gameData.players = gameData.players.filter(p => p.id !== playerId);
    
    if (gameData.players.length === 0) {
      this.games.delete(gameCode);
      this.notifyListeners(gameCode, null);
    } else {
      // If the host left, assign new host
      const wasHost = gameData.players.find(p => p.id === playerId)?.isHost;
      if (wasHost && gameData.players.length > 0) {
        gameData.players[0].isHost = true;
      }
      
      this.games.set(gameCode, gameData);
      this.notifyListeners(gameCode, gameData);
    }
  }

  // Subscribe to game room updates
  subscribeToGameRoom(gameCode, callback) {
    if (!this.listeners.has(gameCode)) {
      this.listeners.set(gameCode, []);
    }
    
    this.listeners.get(gameCode).push(callback);
    
    // Send current state immediately
    const gameData = this.games.get(gameCode);
    if (gameData) {
      callback(gameData);
    }
    
    // Return unsubscribe function
    return () => {
      const gameListeners = this.listeners.get(gameCode);
      if (gameListeners) {
        const index = gameListeners.indexOf(callback);
        if (index > -1) {
          gameListeners.splice(index, 1);
        }
      }
    };
  }

  // Notify listeners
  notifyListeners(gameCode, gameData) {
    const gameListeners = this.listeners.get(gameCode);
    if (gameListeners) {
      gameListeners.forEach(callback => callback(gameData));
    }
  }

  // Generate game code
  generateGameCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Check if game code exists
  async checkGameCodeExists(gameCode) {
    return this.games.has(gameCode);
  }
}

// Create singleton instance
const simpleGameStorage = new SimpleGameStorage();

// Export functions that match Firebase API
export const signInUser = async (username) => {
  return await simpleAuth.signInAnonymously(username);
};

export const signOutUser = async () => {
  return await simpleAuth.signOut();
};

export const onAuthStateChange = (callback) => {
  return simpleAuth.onAuthStateChanged(callback);
};

export const createGameRoom = async (hostId, hostUsername, gameCode, isPrivate = true) => {
  return await simpleGameStorage.createGameRoom(hostId, hostUsername, gameCode);
};

export const joinGameRoom = async (gameCode, playerId, playerUsername) => {
  return await simpleGameStorage.joinGameRoom(gameCode, playerId, playerUsername);
};

export const updatePlayerReady = async (gameCode, playerId, isReady) => {
  return await simpleGameStorage.updatePlayerReady(gameCode, playerId, isReady);
};

export const startGame = async (gameCode, gameState) => {
  return await simpleGameStorage.startGame(gameCode, gameState);
};

export const updateGameState = async (gameCode, gameState) => {
  return await simpleGameStorage.updateGameState(gameCode, gameState);
};

export const addChatMessage = async (gameCode, playerId, playerUsername, message) => {
  return await simpleGameStorage.addChatMessage(gameCode, playerId, playerUsername, message);
};

export const leaveGameRoom = async (gameCode, playerId) => {
  return await simpleGameStorage.leaveGameRoom(gameCode, playerId);
};

export const subscribeToGameRoom = (gameCode, callback) => {
  return simpleGameStorage.subscribeToGameRoom(gameCode, callback);
};

export const generateGameCode = () => {
  return simpleGameStorage.generateGameCode();
};

export const checkGameCodeExists = async (gameCode) => {
  return await simpleGameStorage.checkGameCodeExists(gameCode);
};

// Mock auth object
export const auth = {
  currentUser: simpleAuth.getCurrentUser(),
  onAuthStateChanged: simpleAuth.onAuthStateChanged.bind(simpleAuth),
  signOut: simpleAuth.signOut.bind(simpleAuth)
};

// Mock db object
export const db = {};

// Mock analytics
export const analytics = {};
