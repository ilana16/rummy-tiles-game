import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { useGame } from '../contexts/GameContext.jsx';
import { generateGameCode } from '../lib/simpleAuth.js';
import socketClient from '../lib/socketClient.js';
import { Plus, Users, LogOut, Gamepad2, Dice1, Dice2, Dice3 } from 'lucide-react';

export default function MainMenu({ username, onLogout, onScreenChange }) {
  const { user, subscribeToGame, setError, setLoading } = useGame();
  const [joinCode, setJoinCode] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [useCustomCode, setUseCustomCode] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  const handleCreateGame = async () => {
    if (!user) return;
    
    setIsCreating(true);
    try {
      let gameCode;
      
      if (useCustomCode && customCode.trim()) {
        gameCode = customCode.trim().toUpperCase();
      } else {
        gameCode = generateGameCode();
      }
      
      const gameRoom = await socketClient.createRoom(user.uid, username, gameCode, {
        maxPlayers: 4,
        aiDifficulty: 'medium',
        allowSpectators: false
      });
      
      subscribeToGame(gameCode);
      setCreateDialogOpen(false);
      onScreenChange('room');
    } catch (error) {
      setError('Failed to create game: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGame = async () => {
    if (!user || !joinCode.trim()) return;
    
    setIsJoining(true);
    try {
      const gameCode = joinCode.trim().toUpperCase();
      await socketClient.joinRoom(gameCode, user.uid, username);
      subscribeToGame(gameCode);
      setJoinDialogOpen(false);
      onScreenChange('room');
    } catch (error) {
      setError('Failed to join game: ' + error.message);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2280%22%20height%3D%2280%22%20viewBox%3D%220%200%2080%2080%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23f59e0b%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M0%200h40v40H0V0zm40%2040h40v40H40V40z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
      
      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl flex items-center justify-center shadow-xl mb-4">
            <Gamepad2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            Rummy Tiles
          </h1>
          <p className="text-xl text-gray-600">Welcome back, {username}!</p>
        </div>

        {/* Main Menu Card */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Choose Your Game</CardTitle>
            <CardDescription>Create a new game or join an existing one</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Create Game */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all duration-200">
                  <Plus className="w-6 h-6 mr-3" />
                  Create New Game
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Game</DialogTitle>
                  <DialogDescription>
                    Set up a new game room for you and your friends
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="useCustomCode"
                      checked={useCustomCode}
                      onChange={(e) => setUseCustomCode(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="useCustomCode">Use custom game code</Label>
                  </div>
                  
                  {useCustomCode && (
                    <div className="space-y-2">
                      <Label htmlFor="customCode">Custom Game Code (4-6 characters)</Label>
                      <Input
                        id="customCode"
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                        placeholder="ABCD12"
                        maxLength={6}
                        className="uppercase"
                      />
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleCreateGame}
                      disabled={isCreating || (useCustomCode && customCode.length < 4)}
                      className="flex-1"
                    >
                      {isCreating ? 'Creating...' : 'Create Game'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Separator />

            {/* Join Game */}
            <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg hover:shadow-xl transition-all duration-200">
                  <Users className="w-6 h-6 mr-3" />
                  Join Game
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Join Game</DialogTitle>
                  <DialogDescription>
                    Enter the game code to join an existing game
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="joinCode">Game Code</Label>
                    <Input
                      id="joinCode"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="Enter game code..."
                      className="uppercase text-center text-lg font-mono"
                      maxLength={6}
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleJoinGame}
                      disabled={isJoining || !joinCode.trim()}
                      className="flex-1"
                    >
                      {isJoining ? 'Joining...' : 'Join Game'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setJoinDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Separator />

            {/* Game Rules */}
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Dice1 className="w-5 h-5 mr-2 text-amber-600" />
                  Quick Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start space-x-2">
                  <Dice2 className="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" />
                  <p>Form sets of 3+ tiles: groups (same number, different colors) or runs (consecutive numbers, same color)</p>
                </div>
                <div className="flex items-start space-x-2">
                  <Dice3 className="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" />
                  <p>First meld must be worth 30+ points. Manipulate table sets after your initial meld</p>
                </div>
                <div className="flex items-start space-x-2">
                  <Gamepad2 className="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" />
                  <p>First player to use all tiles wins! Jokers are wild but worth 30 penalty points</p>
                </div>
              </CardContent>
            </Card>

            {/* Logout */}
            <Button
              variant="outline"
              onClick={onLogout}
              className="w-full h-12 text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
