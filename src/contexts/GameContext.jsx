import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { auth, subscribeToGameRoom, updateGameState, addChatMessage as firebaseAddChatMessage } from '../lib/simpleAuth.js';
import { 
  initializeGameState, 
  drawTile, 
  playSet, 
  startManipulation, 
  confirmManipulation, 
  cancelManipulation, 
  processAITurn,
  addChatMessage,
  checkGameEndConditions,
  GAME_PHASES 
} from '../lib/gameState.js';

const GameContext = createContext();

// Game state reducer
function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_GAME_STATE':
      return { ...state, ...action.payload };
      
    case 'UPDATE_ROOM_STATE':
      return { ...state, roomState: action.payload };
      
    case 'DRAW_TILE':
      try {
        const newState = drawTile(state.gameState, action.playerId);
        return { ...state, gameState: newState };
      } catch (error) {
        return { ...state, error: error.message };
      }
      
    case 'PLAY_SET':
      try {
        const newState = playSet(state.gameState, action.playerId, action.tileIds);
        return { ...state, gameState: newState };
      } catch (error) {
        return { ...state, error: error.message };
      }
      
    case 'START_MANIPULATION':
      try {
        const newState = startManipulation(state.gameState, action.playerId);
        return { ...state, gameState: newState };
      } catch (error) {
        return { ...state, error: error.message };
      }
      
    case 'CONFIRM_MANIPULATION':
      try {
        const newState = confirmManipulation(state.gameState, action.playerId);
        return { ...state, gameState: newState };
      } catch (error) {
        return { ...state, error: error.message };
      }
      
    case 'CANCEL_MANIPULATION':
      try {
        const newState = cancelManipulation(state.gameState, action.playerId);
        return { ...state, gameState: newState };
      } catch (error) {
        return { ...state, error: error.message };
      }
      
    case 'PROCESS_AI_TURN':
      try {
        const newState = processAITurn(state.gameState);
        return { ...state, gameState: newState };
      } catch (error) {
        return { ...state, error: error.message };
      }
      
    case 'ADD_CHAT_MESSAGE':
      try {
        const newState = addChatMessage(state.gameState, action.playerId, action.message);
        return { ...state, gameState: newState };
      } catch (error) {
        return { ...state, error: error.message };
      }
      
    case 'SET_ERROR':
      return { ...state, error: action.error };
      
    case 'CLEAR_ERROR':
      return { ...state, error: null };
      
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
      
    default:
      return state;
  }
}

const initialState = {
  user: null,
  roomState: null,
  gameState: null,
  gameCode: null,
  loading: false,
  error: null,
  unsubscribe: null
};

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Initialize user authentication
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      dispatch({ type: 'SET_GAME_STATE', payload: { user } });
    });

    return unsubscribe;
  }, []);

  // Subscribe to game room updates
  const subscribeToGame = (gameCode) => {
    if (state.unsubscribe) {
      state.unsubscribe();
    }

    const unsubscribe = subscribeToGameRoom(gameCode, (roomData) => {
      if (roomData) {
        dispatch({ type: 'UPDATE_ROOM_STATE', payload: roomData });
        
        // If game is playing and we have game data, update local game state
        if (roomData.gameState === 'playing' && roomData.gameData) {
          dispatch({ type: 'SET_GAME_STATE', payload: { gameState: roomData.gameData } });
        }
      }
    });

    dispatch({ type: 'SET_GAME_STATE', payload: { gameCode, unsubscribe } });
  };

  // Start a new game
  const startGame = (players) => {
    const gameState = initializeGameState(players);
    dispatch({ type: 'SET_GAME_STATE', payload: { gameState } });
    
    // Update Firebase with initial game state
    if (state.gameCode) {
      updateGameState(state.gameCode, gameState);
    }
    
    return gameState;
  };

  // Game actions
  const drawTileAction = async (playerId) => {
    dispatch({ type: 'DRAW_TILE', playerId });
    
    // Update Firebase
    if (state.gameCode && state.gameState) {
      const newState = drawTile(state.gameState, playerId);
      await updateGameState(state.gameCode, newState);
    }
  };

  const playSetAction = async (playerId, tileIds) => {
    dispatch({ type: 'PLAY_SET', playerId, tileIds });
    
    // Update Firebase
    if (state.gameCode && state.gameState) {
      const newState = playSet(state.gameState, playerId, tileIds);
      await updateGameState(state.gameCode, newState);
    }
  };

  const startManipulationAction = (playerId) => {
    dispatch({ type: 'START_MANIPULATION', playerId });
  };

  const confirmManipulationAction = async (playerId) => {
    dispatch({ type: 'CONFIRM_MANIPULATION', playerId });
    
    // Update Firebase
    if (state.gameCode && state.gameState) {
      const newState = confirmManipulation(state.gameState, playerId);
      await updateGameState(state.gameCode, newState);
    }
  };

  const cancelManipulationAction = (playerId) => {
    dispatch({ type: 'CANCEL_MANIPULATION', playerId });
  };

  const processAITurnAction = async () => {
    dispatch({ type: 'PROCESS_AI_TURN' });
    
    // Update Firebase
    if (state.gameCode && state.gameState) {
      const newState = processAITurn(state.gameState);
      await updateGameState(state.gameCode, newState);
    }
  };

  const sendChatMessage = async (playerId, message) => {
    if (state.gameCode) {
      const player = state.gameState?.players.find(p => p.id === playerId);
      if (player) {
        await firebaseAddChatMessage(state.gameCode, playerId, player.username, message);
      }
    }
  };

  const setError = (error) => {
    dispatch({ type: 'SET_ERROR', error });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const setLoading = (loading) => {
    dispatch({ type: 'SET_LOADING', loading });
  };

  // Process AI turns automatically
  useEffect(() => {
    if (state.gameState && state.gameState.phase === GAME_PHASES.PLAYING) {
      const currentPlayer = state.gameState.players[state.gameState.currentPlayerIndex];
      
      if (currentPlayer.isAI) {
        // Add a delay for AI turns to make it feel more natural
        const timer = setTimeout(() => {
          processAITurnAction();
        }, 1500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [state.gameState?.currentPlayerIndex, state.gameState?.phase]);

  // Check for game end conditions
  useEffect(() => {
    if (state.gameState) {
      const updatedState = checkGameEndConditions(state.gameState);
      if (updatedState !== state.gameState) {
        dispatch({ type: 'SET_GAME_STATE', payload: { gameState: updatedState } });
        
        // Update Firebase
        if (state.gameCode) {
          updateGameState(state.gameCode, updatedState);
        }
      }
    }
  }, [state.gameState?.pool?.length]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (state.unsubscribe) {
        state.unsubscribe();
      }
    };
  }, [state.unsubscribe]);

  const value = {
    // State
    user: state.user,
    roomState: state.roomState,
    gameState: state.gameState,
    gameCode: state.gameCode,
    loading: state.loading,
    error: state.error,
    
    // Actions
    subscribeToGame,
    startGame,
    drawTile: drawTileAction,
    playSet: playSetAction,
    startManipulation: startManipulationAction,
    confirmManipulation: confirmManipulationAction,
    cancelManipulation: cancelManipulationAction,
    processAITurn: processAITurnAction,
    sendChatMessage,
    setError,
    clearError,
    setLoading
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

export default GameContext;
