// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC7nJRatPacp5mazXrMI73MkxLYfW3ufdk",
  authDomain: "rummy2-abe14.firebaseapp.com",
  projectId: "rummy2-abe14",
  storageBucket: "rummy2-abe14.firebasestorage.app",
  messagingSenderId: "736904994817",
  appId: "1:736904994817:web:1395ae28aae446678ea000",
  measurementId: "G-RXG7B4V8MB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Authentication functions
export const signInUser = async (username) => {
  try {
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;
    
    // Store username in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      username: username,
      createdAt: new Date(),
      isOnline: true
    });
    
    return { user, username };
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    if (auth.currentUser) {
      // Update user status to offline
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        isOnline: false
      });
    }
    await auth.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Game room functions
export const createGameRoom = async (hostId, hostUsername, gameCode, isPrivate = true) => {
  try {
    const gameRef = doc(db, 'games', gameCode);
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
      gameState: 'waiting', // waiting, playing, finished
      isPrivate: isPrivate,
      createdAt: new Date(),
      maxPlayers: 4,
      settings: {
        aiDifficulty: 'medium',
        allowSpectators: false
      }
    };
    
    await setDoc(gameRef, gameData);
    return gameData;
  } catch (error) {
    console.error('Error creating game room:', error);
    throw error;
  }
};

export const joinGameRoom = async (gameCode, playerId, playerUsername) => {
  try {
    const gameRef = doc(db, 'games', gameCode);
    const gameDoc = await getDoc(gameRef);
    
    if (!gameDoc.exists()) {
      throw new Error('Game room not found');
    }
    
    const gameData = gameDoc.data();
    
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
    
    const updatedPlayers = [...gameData.players, {
      id: playerId,
      username: playerUsername,
      isReady: false,
      isHost: false
    }];
    
    await updateDoc(gameRef, {
      players: updatedPlayers
    });
    
    return { ...gameData, players: updatedPlayers };
  } catch (error) {
    console.error('Error joining game room:', error);
    throw error;
  }
};

export const updatePlayerReady = async (gameCode, playerId, isReady) => {
  try {
    const gameRef = doc(db, 'games', gameCode);
    const gameDoc = await getDoc(gameRef);
    
    if (!gameDoc.exists()) {
      throw new Error('Game room not found');
    }
    
    const gameData = gameDoc.data();
    const updatedPlayers = gameData.players.map(player => 
      player.id === playerId ? { ...player, isReady } : player
    );
    
    await updateDoc(gameRef, {
      players: updatedPlayers
    });
    
    return updatedPlayers;
  } catch (error) {
    console.error('Error updating player ready status:', error);
    throw error;
  }
};

export const startGame = async (gameCode, gameState) => {
  try {
    const gameRef = doc(db, 'games', gameCode);
    await updateDoc(gameRef, {
      gameState: 'playing',
      gameData: gameState,
      startedAt: new Date()
    });
  } catch (error) {
    console.error('Error starting game:', error);
    throw error;
  }
};

export const updateGameState = async (gameCode, gameState) => {
  try {
    const gameRef = doc(db, 'games', gameCode);
    await updateDoc(gameRef, {
      gameData: gameState,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error updating game state:', error);
    throw error;
  }
};

export const addChatMessage = async (gameCode, playerId, playerUsername, message) => {
  try {
    const gameRef = doc(db, 'games', gameCode);
    const gameDoc = await getDoc(gameRef);
    
    if (!gameDoc.exists()) {
      throw new Error('Game room not found');
    }
    
    const gameData = gameDoc.data();
    const chatMessage = {
      id: Date.now().toString(),
      playerId,
      playerUsername,
      message,
      timestamp: new Date()
    };
    
    const updatedChat = [...(gameData.chat || []), chatMessage];
    
    await updateDoc(gameRef, {
      chat: updatedChat
    });
    
    return chatMessage;
  } catch (error) {
    console.error('Error adding chat message:', error);
    throw error;
  }
};

export const leaveGameRoom = async (gameCode, playerId) => {
  try {
    const gameRef = doc(db, 'games', gameCode);
    const gameDoc = await getDoc(gameRef);
    
    if (!gameDoc.exists()) {
      return;
    }
    
    const gameData = gameDoc.data();
    const updatedPlayers = gameData.players.filter(p => p.id !== playerId);
    
    if (updatedPlayers.length === 0) {
      // Delete the game room if no players left
      await updateDoc(gameRef, {
        gameState: 'finished',
        endedAt: new Date()
      });
    } else {
      // If the host left, assign new host
      const wasHost = gameData.players.find(p => p.id === playerId)?.isHost;
      if (wasHost && updatedPlayers.length > 0) {
        updatedPlayers[0].isHost = true;
      }
      
      await updateDoc(gameRef, {
        players: updatedPlayers
      });
    }
  } catch (error) {
    console.error('Error leaving game room:', error);
    throw error;
  }
};

// Real-time listeners
export const subscribeToGameRoom = (gameCode, callback) => {
  const gameRef = doc(db, 'games', gameCode);
  return onSnapshot(gameRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      callback(null);
    }
  });
};

// Utility functions
export const generateGameCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const checkGameCodeExists = async (gameCode) => {
  try {
    const gameRef = doc(db, 'games', gameCode);
    const gameDoc = await getDoc(gameRef);
    return gameDoc.exists();
  } catch (error) {
    console.error('Error checking game code:', error);
    return false;
  }
};

export { auth, db, analytics };
