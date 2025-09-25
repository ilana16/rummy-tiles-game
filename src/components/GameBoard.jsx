import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { useGame } from '../contexts/GameContext.jsx';
import TileComponent from './TileComponent.jsx';
import PlayerHand from './PlayerHand.jsx';
import GameTable from './GameTable.jsx';
import ChatPanel from './ChatPanel.jsx';
import { getCurrentPlayer, isPlayerTurn } from '../lib/gameState.js';
import { GAME_PHASES } from '../lib/gameState.js';
import { ArrowLeft, Crown, Bot, Users, MessageCircle, Trophy, Flag } from 'lucide-react';

export default function GameBoard({ onScreenChange }) {
  const { user, gameState, roomState, drawTile, playSet, sendChatMessage } = useGame();
  const [selectedTiles, setSelectedTiles] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  const currentPlayer = gameState ? getCurrentPlayer(gameState) : null;
  const isMyTurn = gameState ? isPlayerTurn(gameState, user?.uid) : false;
  const myPlayer = gameState?.players?.find(p => p.id === user?.uid);

  const handleDrawTile = async () => {
    if (!isMyTurn || !user) return;
    
    try {
      await drawTile(user.uid);
      setSelectedTiles([]);
    } catch (error) {
      console.error('Failed to draw tile:', error);
    }
  };

  const handlePlaySet = async () => {
    if (!isMyTurn || !user || selectedTiles.length < 3) return;
    
    try {
      await playSet(user.uid, selectedTiles);
      setSelectedTiles([]);
    } catch (error) {
      console.error('Failed to play set:', error);
    }
  };

  const handleTileSelect = (tileId) => {
    setSelectedTiles(prev => {
      if (prev.includes(tileId)) {
        return prev.filter(id => id !== tileId);
      } else {
        return [...prev, tileId];
      }
    });
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !user) return;
    
    try {
      await sendChatMessage(user.uid, chatMessage.trim());
      setChatMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleLeaveGame = () => {
    // TODO: Implement forfeit/surrender logic
    onScreenChange('menu');
  };

  if (!gameState || !roomState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  if (gameState.phase === GAME_PHASES.FINISHED) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Game Over!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                🎉 {gameState.winner?.username} Wins! 🎉
              </h2>
              <p className="text-gray-600">Congratulations on a great game!</p>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800">Final Scores:</h3>
              {gameState.players.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    player.id === gameState.winner?.id
                      ? 'bg-green-100 border-2 border-green-300'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                      player.isHost
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                        : player.isAI
                        ? 'bg-gradient-to-r from-purple-400 to-indigo-500'
                        : 'bg-gradient-to-r from-blue-400 to-indigo-500'
                    }`}>
                      {player.isHost ? (
                        <Crown className="w-4 h-4" />
                      ) : player.isAI ? (
                        <Bot className="w-4 h-4" />
                      ) : (
                        player.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="font-medium">{player.username}</span>
                    {player.id === gameState.winner?.id && (
                      <Badge className="bg-green-500">Winner</Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${
                      gameState.finalScores?.[index] > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {gameState.finalScores?.[index] > 0 ? '+' : ''}{gameState.finalScores?.[index] || 0}
                    </span>
                    <div className="text-xs text-gray-500">
                      {player.hand.length} tiles left
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => onScreenChange('menu')}
                className="flex-1 h-12 font-semibold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                Back to Menu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-orange-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handleLeaveGame}
              size="sm"
              className="flex items-center space-x-2"
            >
              <Flag className="w-4 h-4" />
              <span>Forfeit</span>
            </Button>
            
            <div className="text-sm text-gray-600">
              Game: <span className="font-mono font-bold">{roomState.id}</span>
            </div>
          </div>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Rummy Tiles
            </h1>
            <div className="text-sm text-gray-600">
              {isMyTurn ? (
                <span className="text-green-600 font-semibold">Your Turn</span>
              ) : (
                <span>{currentPlayer?.username}'s Turn</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowChat(!showChat)}
              size="sm"
              className="flex items-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat</span>
            </Button>
            
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">{gameState.players.length} players</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Game Area */}
        <div className="flex-1 flex flex-col">
          {/* Players Info */}
          <div className="bg-white/60 backdrop-blur-sm border-b border-orange-200 p-4">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {gameState.players.map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                      player.id === currentPlayer?.id
                        ? 'bg-green-100 border-2 border-green-300 shadow-md'
                        : 'bg-white/80 border border-gray-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      player.isHost
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                        : player.isAI
                        ? 'bg-gradient-to-r from-purple-400 to-indigo-500'
                        : 'bg-gradient-to-r from-blue-400 to-indigo-500'
                    }`}>
                      {player.isHost ? (
                        <Crown className="w-5 h-5" />
                      ) : player.isAI ? (
                        <Bot className="w-5 h-5" />
                      ) : (
                        player.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{player.username}</p>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-gray-600">{player.hand.length} tiles</span>
                        {!player.hasInitialMeld && (
                          <Badge variant="outline" className="text-xs">No meld</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Game Table */}
          <div className="flex-1 p-4">
            <GameTable
              tableSets={gameState.table}
              tempTableState={gameState.tempTableState}
              manipulationInProgress={gameState.manipulationInProgress}
            />
          </div>

          {/* Player Hand and Controls */}
          <div className="bg-white/80 backdrop-blur-sm border-t border-orange-200 p-4">
            <div className="max-w-7xl mx-auto">
              {myPlayer && (
                <PlayerHand
                  player={myPlayer}
                  selectedTiles={selectedTiles}
                  onTileSelect={handleTileSelect}
                  isMyTurn={isMyTurn}
                />
              )}
              
              {/* Action Buttons */}
              <div className="flex items-center justify-center space-x-4 mt-4">
                <Button
                  onClick={handleDrawTile}
                  disabled={!isMyTurn || gameState.pool.length === 0}
                  variant="outline"
                  className="h-10"
                >
                  Draw Tile ({gameState.pool.length} left)
                </Button>
                
                <Button
                  onClick={handlePlaySet}
                  disabled={!isMyTurn || selectedTiles.length < 3}
                  className="h-10 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  Play Set ({selectedTiles.length} selected)
                </Button>
                
                {myPlayer?.hasInitialMeld && (
                  <Button
                    disabled={!isMyTurn}
                    variant="outline"
                    className="h-10"
                  >
                    Manipulate Table
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="w-80 border-l border-orange-200 bg-white/90 backdrop-blur-sm">
            <ChatPanel
              messages={roomState.chat || []}
              currentUserId={user?.uid}
              onSendMessage={handleSendMessage}
              message={chatMessage}
              onMessageChange={setChatMessage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
