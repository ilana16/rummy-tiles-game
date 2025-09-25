// Game state management utilities
import { createTileSet, shuffleTiles, dealInitialTiles, isValidSet, calculateSetPoints, canMakeInitialMeld, validateTableState, isGameWon, calculateFinalScores, generateAIMove, AI_DIFFICULTY } from './gameLogic.js';

export const GAME_PHASES = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished'
};

export const TURN_ACTIONS = {
  DRAW: 'draw',
  PLAY_SET: 'play_set',
  MANIPULATE: 'manipulate',
  END_TURN: 'end_turn'
};

// Initialize a new game state
export function initializeGameState(players) {
  const tiles = createTileSet();
  const shuffledTiles = shuffleTiles(tiles);
  const { hands, pool } = dealInitialTiles(shuffledTiles, players.length);
  
  return {
    phase: GAME_PHASES.PLAYING,
    players: players.map((player, index) => ({
      ...player,
      hand: hands[index],
      hasInitialMeld: false,
      score: 0,
      isAI: player.isAI || false,
      aiDifficulty: player.aiDifficulty || AI_DIFFICULTY.MEDIUM
    })),
    currentPlayerIndex: 0,
    pool: pool,
    table: [], // Array of sets on the table
    turnHistory: [],
    gameStartTime: new Date(),
    lastAction: null,
    manipulationInProgress: false,
    tempTableState: null, // For manipulation validation
    chat: []
  };
}

// Get current player
export function getCurrentPlayer(gameState) {
  return gameState.players[gameState.currentPlayerIndex];
}

// Check if it's a player's turn
export function isPlayerTurn(gameState, playerId) {
  const currentPlayer = getCurrentPlayer(gameState);
  return currentPlayer.id === playerId;
}

// Draw a tile from the pool
export function drawTile(gameState, playerId) {
  if (!isPlayerTurn(gameState, playerId)) {
    throw new Error('Not your turn');
  }
  
  if (gameState.pool.length === 0) {
    throw new Error('No tiles left in pool');
  }
  
  const newGameState = { ...gameState };
  const currentPlayer = getCurrentPlayer(newGameState);
  const drawnTile = newGameState.pool.pop();
  
  // Add tile to player's hand
  const playerIndex = newGameState.currentPlayerIndex;
  newGameState.players[playerIndex] = {
    ...currentPlayer,
    hand: [...currentPlayer.hand, drawnTile]
  };
  
  // End turn after drawing
  newGameState.currentPlayerIndex = (newGameState.currentPlayerIndex + 1) % newGameState.players.length;
  newGameState.lastAction = {
    type: TURN_ACTIONS.DRAW,
    playerId: playerId,
    timestamp: new Date()
  };
  
  return newGameState;
}

// Play a set from hand to table
export function playSet(gameState, playerId, tileIds) {
  if (!isPlayerTurn(gameState, playerId)) {
    throw new Error('Not your turn');
  }
  
  const currentPlayer = getCurrentPlayer(gameState);
  const tilesToPlay = tileIds.map(id => currentPlayer.hand.find(tile => tile.id === id));
  
  if (tilesToPlay.some(tile => !tile)) {
    throw new Error('Invalid tiles selected');
  }
  
  if (!isValidSet(tilesToPlay)) {
    throw new Error('Invalid set');
  }
  
  // Check initial meld requirement
  if (!currentPlayer.hasInitialMeld) {
    const setPoints = calculateSetPoints(tilesToPlay);
    if (setPoints < 30) {
      throw new Error('Initial meld must be at least 30 points');
    }
  }
  
  const newGameState = { ...gameState };
  const playerIndex = newGameState.currentPlayerIndex;
  
  // Remove tiles from hand
  const newHand = currentPlayer.hand.filter(tile => !tileIds.includes(tile.id));
  
  // Add set to table
  const newTable = [...newGameState.table, tilesToPlay];
  
  newGameState.players[playerIndex] = {
    ...currentPlayer,
    hand: newHand,
    hasInitialMeld: true
  };
  
  newGameState.table = newTable;
  newGameState.lastAction = {
    type: TURN_ACTIONS.PLAY_SET,
    playerId: playerId,
    set: tilesToPlay,
    timestamp: new Date()
  };
  
  // Check if game is won
  if (isGameWon(newHand)) {
    newGameState.phase = GAME_PHASES.FINISHED;
    newGameState.winner = currentPlayer;
    newGameState.finalScores = calculateFinalScores(newGameState.players.map(p => p.hand));
  } else {
    // End turn
    newGameState.currentPlayerIndex = (newGameState.currentPlayerIndex + 1) % newGameState.players.length;
  }
  
  return newGameState;
}

// Start manipulation mode
export function startManipulation(gameState, playerId) {
  if (!isPlayerTurn(gameState, playerId)) {
    throw new Error('Not your turn');
  }
  
  const currentPlayer = getCurrentPlayer(gameState);
  if (!currentPlayer.hasInitialMeld) {
    throw new Error('Must complete initial meld before manipulation');
  }
  
  return {
    ...gameState,
    manipulationInProgress: true,
    tempTableState: [...gameState.table] // Copy current table state
  };
}

// Update table during manipulation
export function updateTableManipulation(gameState, playerId, newTableState) {
  if (!isPlayerTurn(gameState, playerId)) {
    throw new Error('Not your turn');
  }
  
  if (!gameState.manipulationInProgress) {
    throw new Error('Not in manipulation mode');
  }
  
  return {
    ...gameState,
    tempTableState: newTableState
  };
}

// Confirm manipulation
export function confirmManipulation(gameState, playerId) {
  if (!isPlayerTurn(gameState, playerId)) {
    throw new Error('Not your turn');
  }
  
  if (!gameState.manipulationInProgress) {
    throw new Error('Not in manipulation mode');
  }
  
  // Validate the new table state
  if (!validateTableState(gameState.tempTableState)) {
    throw new Error('Invalid table configuration');
  }
  
  const newGameState = {
    ...gameState,
    table: gameState.tempTableState,
    manipulationInProgress: false,
    tempTableState: null,
    lastAction: {
      type: TURN_ACTIONS.MANIPULATE,
      playerId: playerId,
      timestamp: new Date()
    }
  };
  
  // End turn
  newGameState.currentPlayerIndex = (newGameState.currentPlayerIndex + 1) % newGameState.players.length;
  
  return newGameState;
}

// Cancel manipulation
export function cancelManipulation(gameState, playerId) {
  if (!isPlayerTurn(gameState, playerId)) {
    throw new Error('Not your turn');
  }
  
  return {
    ...gameState,
    manipulationInProgress: false,
    tempTableState: null
  };
}

// Add tile from hand to manipulation
export function addTileToManipulation(gameState, playerId, tileId) {
  if (!isPlayerTurn(gameState, playerId)) {
    throw new Error('Not your turn');
  }
  
  if (!gameState.manipulationInProgress) {
    throw new Error('Not in manipulation mode');
  }
  
  const currentPlayer = getCurrentPlayer(gameState);
  const tile = currentPlayer.hand.find(t => t.id === tileId);
  
  if (!tile) {
    throw new Error('Tile not found in hand');
  }
  
  const newGameState = { ...gameState };
  const playerIndex = newGameState.currentPlayerIndex;
  
  // Remove tile from hand
  newGameState.players[playerIndex] = {
    ...currentPlayer,
    hand: currentPlayer.hand.filter(t => t.id !== tileId)
  };
  
  // Add tile to temp table (as a single tile set for now)
  newGameState.tempTableState = [...gameState.tempTableState, [tile]];
  
  return newGameState;
}

// Process AI turn
export function processAITurn(gameState) {
  const currentPlayer = getCurrentPlayer(gameState);
  
  if (!currentPlayer.isAI) {
    throw new Error('Current player is not AI');
  }
  
  const aiMove = generateAIMove(currentPlayer.hand, gameState.table, currentPlayer.aiDifficulty);
  
  switch (aiMove.type) {
    case 'play_set':
      const tileIds = aiMove.set.map(tile => tile.id);
      return playSet(gameState, currentPlayer.id, tileIds);
      
    case 'draw':
      return drawTile(gameState, currentPlayer.id);
      
    default:
      return drawTile(gameState, currentPlayer.id);
  }
}

// Add chat message to game state
export function addChatMessage(gameState, playerId, message) {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) {
    throw new Error('Player not found');
  }
  
  const chatMessage = {
    id: Date.now().toString(),
    playerId: playerId,
    playerUsername: player.username,
    message: message,
    timestamp: new Date()
  };
  
  return {
    ...gameState,
    chat: [...gameState.chat, chatMessage]
  };
}

// Get game statistics
export function getGameStatistics(gameState) {
  return {
    totalTurns: gameState.turnHistory.length,
    tilesInPool: gameState.pool.length,
    setsOnTable: gameState.table.length,
    currentPhase: gameState.phase,
    gameStartTime: gameState.gameStartTime,
    players: gameState.players.map(player => ({
      id: player.id,
      username: player.username,
      tilesInHand: player.hand.length,
      hasInitialMeld: player.hasInitialMeld,
      isAI: player.isAI
    }))
  };
}

// Check if game should end due to empty pool
export function checkGameEndConditions(gameState) {
  if (gameState.pool.length === 0 && gameState.phase === GAME_PHASES.PLAYING) {
    // Game ends when pool is empty - find winner with fewest tiles
    const tileCounts = gameState.players.map(p => p.hand.length);
    const minTiles = Math.min(...tileCounts);
    const winnerIndex = tileCounts.indexOf(minTiles);
    
    return {
      ...gameState,
      phase: GAME_PHASES.FINISHED,
      winner: gameState.players[winnerIndex],
      finalScores: calculateFinalScores(gameState.players.map(p => p.hand))
    };
  }
  
  return gameState;
}
