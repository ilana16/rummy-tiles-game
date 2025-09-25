const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// In-memory storage for games (in production, use a database)
const games = new Map();
const players = new Map();

// Game state management
class GameManager {
  constructor() {
    this.games = new Map();
  }

  createGame(gameCode, hostId, hostUsername) {
    const game = {
      id: gameCode,
      hostId: hostId,
      hostUsername: hostUsername,
      players: [{
        id: hostId,
        username: hostUsername,
        isReady: false,
        isHost: true,
        socketId: null
      }],
      gameState: 'waiting',
      isPrivate: true,
      createdAt: new Date(),
      maxPlayers: 4,
      gameData: null,
      chat: []
    };
    
    this.games.set(gameCode, game);
    return game;
  }

  joinGame(gameCode, playerId, playerUsername, socketId) {
    const game = this.games.get(gameCode);
    if (!game) {
      throw new Error('Game not found');
    }

    if (game.players.length >= game.maxPlayers) {
      throw new Error('Game is full');
    }

    if (game.gameState !== 'waiting') {
      throw new Error('Game has already started');
    }

    // Check if player is already in the game
    const existingPlayerIndex = game.players.findIndex(p => p.id === playerId);
    if (existingPlayerIndex !== -1) {
      // Update socket ID for reconnection
      game.players[existingPlayerIndex].socketId = socketId;
      return game;
    }

    game.players.push({
      id: playerId,
      username: playerUsername,
      isReady: false,
      isHost: false,
      socketId: socketId
    });

    return game;
  }

  updatePlayerReady(gameCode, playerId, isReady) {
    const game = this.games.get(gameCode);
    if (!game) {
      throw new Error('Game not found');
    }

    const player = game.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    player.isReady = isReady;
    return game;
  }

  startGame(gameCode, gameData) {
    const game = this.games.get(gameCode);
    if (!game) {
      throw new Error('Game not found');
    }

    game.gameState = 'playing';
    game.gameData = gameData;
    game.startedAt = new Date();
    
    return game;
  }

  updateGameData(gameCode, gameData) {
    const game = this.games.get(gameCode);
    if (!game) {
      throw new Error('Game not found');
    }

    game.gameData = gameData;
    game.lastUpdated = new Date();
    
    return game;
  }

  addChatMessage(gameCode, playerId, playerUsername, message) {
    const game = this.games.get(gameCode);
    if (!game) {
      throw new Error('Game not found');
    }

    const chatMessage = {
      id: uuidv4(),
      playerId,
      playerUsername,
      message,
      timestamp: new Date()
    };

    game.chat.push(chatMessage);
    
    // Keep only last 100 messages
    if (game.chat.length > 100) {
      game.chat = game.chat.slice(-100);
    }

    return chatMessage;
  }

  leaveGame(gameCode, playerId) {
    const game = this.games.get(gameCode);
    if (!game) {
      return null;
    }

    game.players = game.players.filter(p => p.id !== playerId);

    if (game.players.length === 0) {
      // Delete empty game
      this.games.delete(gameCode);
      return null;
    }

    // If host left, assign new host
    const wasHost = game.players.find(p => p.id === playerId)?.isHost;
    if (wasHost && game.players.length > 0) {
      game.players[0].isHost = true;
      game.hostId = game.players[0].id;
      game.hostUsername = game.players[0].username;
    }

    return game;
  }

  getGame(gameCode) {
    return this.games.get(gameCode);
  }

  gameExists(gameCode) {
    return this.games.has(gameCode);
  }
}

const gameManager = new GameManager();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Store player info
  socket.on('register_player', (data) => {
    players.set(socket.id, {
      id: data.playerId,
      username: data.username,
      socketId: socket.id
    });
  });

  // Create game room
  socket.on('create_game', (data, callback) => {
    try {
      const { gameCode, hostId, hostUsername } = data;
      
      if (gameManager.gameExists(gameCode)) {
        callback({ success: false, error: 'Game code already exists' });
        return;
      }

      const game = gameManager.createGame(gameCode, hostId, hostUsername);
      
      // Update player socket ID
      const player = game.players.find(p => p.id === hostId);
      if (player) {
        player.socketId = socket.id;
      }

      socket.join(gameCode);
      callback({ success: true, game });
      
      // Broadcast to room
      io.to(gameCode).emit('game_updated', game);
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Join game room
  socket.on('join_game', (data, callback) => {
    try {
      const { gameCode, playerId, playerUsername } = data;
      
      const game = gameManager.joinGame(gameCode, playerId, playerUsername, socket.id);
      
      socket.join(gameCode);
      callback({ success: true, game });
      
      // Broadcast to room
      io.to(gameCode).emit('game_updated', game);
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Update player ready status
  socket.on('update_ready', (data, callback) => {
    try {
      const { gameCode, playerId, isReady } = data;
      
      const game = gameManager.updatePlayerReady(gameCode, playerId, isReady);
      
      callback({ success: true });
      
      // Broadcast to room
      io.to(gameCode).emit('game_updated', game);
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Start game
  socket.on('start_game', (data, callback) => {
    try {
      const { gameCode, gameData } = data;
      
      const game = gameManager.startGame(gameCode, gameData);
      
      callback({ success: true });
      
      // Broadcast to room
      io.to(gameCode).emit('game_updated', game);
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Update game state
  socket.on('update_game_state', (data, callback) => {
    try {
      const { gameCode, gameData } = data;
      
      const game = gameManager.updateGameData(gameCode, gameData);
      
      if (callback) callback({ success: true });
      
      // Broadcast to room
      io.to(gameCode).emit('game_updated', game);
    } catch (error) {
      if (callback) callback({ success: false, error: error.message });
    }
  });

  // Send chat message
  socket.on('send_message', (data, callback) => {
    try {
      const { gameCode, playerId, playerUsername, message } = data;
      
      const chatMessage = gameManager.addChatMessage(gameCode, playerId, playerUsername, message);
      const game = gameManager.getGame(gameCode);
      
      callback({ success: true, message: chatMessage });
      
      // Broadcast to room
      io.to(gameCode).emit('game_updated', game);
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Leave game
  socket.on('leave_game', (data, callback) => {
    try {
      const { gameCode, playerId } = data;
      
      const game = gameManager.leaveGame(gameCode, playerId);
      
      socket.leave(gameCode);
      
      if (callback) callback({ success: true });
      
      if (game) {
        // Broadcast to remaining players
        io.to(gameCode).emit('game_updated', game);
      }
    } catch (error) {
      if (callback) callback({ success: false, error: error.message });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const player = players.get(socket.id);
    if (player) {
      // Find games this player was in and mark them as disconnected
      for (const [gameCode, game] of gameManager.games) {
        const gamePlayer = game.players.find(p => p.id === player.id);
        if (gamePlayer) {
          gamePlayer.socketId = null;
          gamePlayer.isConnected = false;
          
          // Broadcast player disconnection
          io.to(gameCode).emit('player_disconnected', {
            playerId: player.id,
            playerUsername: player.username
          });
        }
      }
      
      players.delete(socket.id);
    }
  });

  // Reconnect to game
  socket.on('reconnect_to_game', (data, callback) => {
    try {
      const { gameCode, playerId } = data;
      
      const game = gameManager.getGame(gameCode);
      if (!game) {
        callback({ success: false, error: 'Game not found' });
        return;
      }

      const player = game.players.find(p => p.id === playerId);
      if (!player) {
        callback({ success: false, error: 'Player not found in game' });
        return;
      }

      // Update socket ID and connection status
      player.socketId = socket.id;
      player.isConnected = true;

      socket.join(gameCode);
      callback({ success: true, game });
      
      // Broadcast reconnection
      io.to(gameCode).emit('player_reconnected', {
        playerId: playerId,
        playerUsername: player.username
      });
      
      io.to(gameCode).emit('game_updated', game);
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });
});

// REST API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/games/:gameCode', (req, res) => {
  const game = gameManager.getGame(req.params.gameCode);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  res.json(game);
});

app.post('/api/games/:gameCode/exists', (req, res) => {
  const exists = gameManager.gameExists(req.params.gameCode);
  res.json({ exists });
});

// Generate random game code
function generateGameCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

app.post('/api/generate-code', (req, res) => {
  let gameCode;
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    gameCode = generateGameCode();
    attempts++;
  } while (gameManager.gameExists(gameCode) && attempts < maxAttempts);
  
  if (attempts >= maxAttempts) {
    return res.status(500).json({ error: 'Could not generate unique game code' });
  }
  
  res.json({ gameCode });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server ready for connections`);
});
