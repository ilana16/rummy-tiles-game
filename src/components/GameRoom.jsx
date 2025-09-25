import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { useGame } from '../contexts/GameContext.jsx';
import { updatePlayerReady, startGame as firebaseStartGame, leaveGameRoom } from '../lib/simpleAuth.js';
import { AI_DIFFICULTY } from '../lib/gameLogic.js';
import { Copy, Check, Users, Crown, Bot, Play, ArrowLeft, UserCheck, UserX } from 'lucide-react';

export default function GameRoom({ onScreenChange }) {
  const { user, roomState, startGame, subscribeToGame } = useGame();
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const isHost = roomState?.players?.find(p => p.id === user?.uid)?.isHost || false;
  const currentPlayer = roomState?.players?.find(p => p.id === user?.uid);
  const allPlayersReady = roomState?.players?.every(p => p.isReady) || false;
  const canStart = roomState?.players?.length >= 2 && allPlayersReady && isHost;

  const copyGameCode = async () => {
    if (roomState?.id) {
      await navigator.clipboard.writeText(roomState.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleReady = async () => {
    if (!user || !roomState) return;
    
    try {
      await updatePlayerReady(roomState.id, user.uid, !currentPlayer?.isReady);
    } catch (error) {
      console.error('Failed to update ready status:', error);
    }
  };

  const handleStartGame = async () => {
    if (!canStart || !roomState) return;
    
    setIsStarting(true);
    try {
      // Add AI players if needed to fill slots
      const players = [...roomState.players];
      const aiDifficulties = [AI_DIFFICULTY.EASY, AI_DIFFICULTY.MEDIUM, AI_DIFFICULTY.HARD];
      
      // Add AI players to make it more interesting (optional)
      while (players.length < 4) {
        const aiDifficulty = aiDifficulties[Math.floor(Math.random() * aiDifficulties.length)];
        players.push({
          id: `ai-${players.length}`,
          username: `AI ${players.length} (${aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1)})`,
          isReady: true,
          isHost: false,
          isAI: true,
          aiDifficulty: aiDifficulty
        });
      }
      
      const gameState = startGame(players);
      await firebaseStartGame(roomState.id, gameState);
    } catch (error) {
      console.error('Failed to start game:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!user || !roomState) return;
    
    try {
      await leaveGameRoom(roomState.id, user.uid);
      onScreenChange('menu');
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  };

  if (!roomState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={handleLeaveRoom}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Leave Room</span>
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Game Room
            </h1>
            <div className="flex items-center justify-center space-x-2 mt-2">
              <span className="text-lg font-mono font-bold text-gray-700">{roomState.id}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyGameCode}
                className="h-8 w-8 p-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players List */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Players ({roomState.players.length}/{roomState.maxPlayers})</span>
                </CardTitle>
                <CardDescription>
                  Waiting for all players to be ready...
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {roomState.players.map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200 ${
                      player.isReady
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
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
                      <div>
                        <p className="font-semibold text-gray-800">{player.username}</p>
                        <div className="flex items-center space-x-2">
                          {player.isHost && (
                            <Badge variant="secondary" className="text-xs">
                              Host
                            </Badge>
                          )}
                          {player.isAI && (
                            <Badge variant="outline" className="text-xs">
                              AI
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {player.isReady ? (
                        <div className="flex items-center space-x-1 text-green-600">
                          <UserCheck className="w-5 h-5" />
                          <span className="font-medium">Ready</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-gray-500">
                          <UserX className="w-5 h-5" />
                          <span className="font-medium">Not Ready</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Empty slots */}
                {Array.from({ length: roomState.maxPlayers - roomState.players.length }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="flex items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50"
                  >
                    <span className="text-gray-500">Waiting for player...</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Game Controls */}
          <div className="space-y-6">
            {/* Ready Status */}
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Your Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={toggleReady}
                  className={`w-full h-12 font-semibold transition-all duration-200 ${
                    currentPlayer?.isReady
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  {currentPlayer?.isReady ? (
                    <>
                      <UserCheck className="w-5 h-5 mr-2" />
                      Ready to Play
                    </>
                  ) : (
                    <>
                      <UserX className="w-5 h-5 mr-2" />
                      Click When Ready
                    </>
                  )}
                </Button>
                
                {isHost && (
                  <>
                    <Separator />
                    <Button
                      onClick={handleStartGame}
                      disabled={!canStart || isStarting}
                      className="w-full h-12 font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-400"
                    >
                      {isStarting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Starting Game...
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Start Game
                        </>
                      )}
                    </Button>
                    
                    {!canStart && (
                      <p className="text-sm text-gray-500 text-center">
                        {roomState.players.length < 2
                          ? 'Need at least 2 players to start'
                          : 'All players must be ready to start'
                        }
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Game Info */}
            <Card className="shadow-xl border-0 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
              <CardHeader>
                <CardTitle className="text-lg">Game Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Players:</span>
                  <span className="font-medium">2-4 players</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tiles per player:</span>
                  <span className="font-medium">14 tiles</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Initial meld:</span>
                  <span className="font-medium">30+ points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">AI difficulty:</span>
                  <span className="font-medium">Mixed levels</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
