import React from 'react';
import TileComponent from './TileComponent.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Hand, Target } from 'lucide-react';

export default function PlayerHand({ 
  player, 
  selectedTiles, 
  onTileSelect, 
  isMyTurn 
}) {
  // Sort tiles by color and number for better organization
  const sortedTiles = [...player.hand].sort((a, b) => {
    if (a.isJoker && !b.isJoker) return 1;
    if (!a.isJoker && b.isJoker) return -1;
    if (a.isJoker && b.isJoker) return 0;
    
    const colorOrder = { red: 0, blue: 1, yellow: 2, black: 3 };
    const colorDiff = colorOrder[a.color] - colorOrder[b.color];
    if (colorDiff !== 0) return colorDiff;
    
    return a.number - b.number;
  });

  // Organize tiles into rows (max 14 tiles per row for better layout)
  const tilesPerRow = 14;
  const rows = [];
  for (let i = 0; i < sortedTiles.length; i += tilesPerRow) {
    rows.push(sortedTiles.slice(i, i + tilesPerRow));
  }

  const selectedCount = selectedTiles.length;
  const canFormSet = selectedCount >= 3;

  return (
    <Card className="shadow-lg border-2 border-orange-200 bg-gradient-to-r from-amber-50 to-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Hand className="w-5 h-5 text-orange-600" />
            <span>Your Hand ({player.hand.length} tiles)</span>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {!player.hasInitialMeld && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                <Target className="w-3 h-3 mr-1" />
                Need 30+ points
              </Badge>
            )}
            
            {selectedCount > 0 && (
              <Badge 
                variant={canFormSet ? "default" : "secondary"}
                className={canFormSet ? "bg-green-500" : ""}
              >
                {selectedCount} selected
              </Badge>
            )}
            
            {isMyTurn && (
              <Badge className="bg-green-500 animate-pulse">
                Your Turn
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {rows.map((row, rowIndex) => (
          <div 
            key={rowIndex}
            className="flex items-center justify-center space-x-2 p-2 bg-white/60 rounded-lg border border-orange-200"
          >
            {row.map((tile) => (
              <TileComponent
                key={tile.id}
                tile={tile}
                isSelected={selectedTiles.includes(tile.id)}
                onClick={isMyTurn ? onTileSelect : undefined}
                size="normal"
                className={`
                  ${isMyTurn ? 'hover:shadow-lg' : 'opacity-75 cursor-not-allowed'}
                  ${selectedTiles.includes(tile.id) ? 'ring-2 ring-orange-400 ring-offset-2' : ''}
                `}
              />
            ))}
          </div>
        ))}
        
        {player.hand.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Hand className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No tiles in hand</p>
          </div>
        )}
        
        {/* Selection helper */}
        {isMyTurn && selectedCount > 0 && (
          <div className="text-center text-sm text-gray-600 bg-white/80 rounded-lg p-2">
            {selectedCount < 3 ? (
              <p>Select at least 3 tiles to form a set</p>
            ) : canFormSet ? (
              <p className="text-green-600 font-medium">
                Ready to play set! Click "Play Set" to place on table
              </p>
            ) : (
              <p>Selected tiles ready for play</p>
            )}
          </div>
        )}
        
        {/* Initial meld helper */}
        {isMyTurn && !player.hasInitialMeld && (
          <div className="text-center text-sm bg-amber-100 border border-amber-300 rounded-lg p-3">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <Target className="w-4 h-4 text-amber-600" />
              <span className="font-medium text-amber-800">Initial Meld Required</span>
            </div>
            <p className="text-amber-700">
              Your first play must be worth at least 30 points using only tiles from your hand
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
