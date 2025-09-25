import React from 'react';
import TileComponent from './TileComponent.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { calculateSetPoints, isValidGroup, isValidRun } from '../lib/gameLogic.js';
import { Table, CheckCircle, XCircle, Shuffle } from 'lucide-react';

export default function GameTable({ 
  tableSets, 
  tempTableState, 
  manipulationInProgress 
}) {
  const displaySets = manipulationInProgress ? tempTableState : tableSets;
  
  const getSetType = (set) => {
    if (isValidGroup(set)) return 'Group';
    if (isValidRun(set)) return 'Run';
    return 'Invalid';
  };

  const getSetValidation = (set) => {
    const isValid = isValidGroup(set) || isValidRun(set);
    return {
      isValid,
      points: calculateSetPoints(set),
      type: getSetType(set)
    };
  };

  if (!displaySets || displaySets.length === 0) {
    return (
      <Card className="h-full shadow-lg border-2 border-orange-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-xl">
            <Table className="w-6 h-6 text-orange-600" />
            <span>Game Table</span>
            {manipulationInProgress && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                <Shuffle className="w-3 h-3 mr-1" />
                Manipulating
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Table className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No sets on the table yet</p>
            <p className="text-sm">Players will place their sets here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full shadow-lg border-2 border-orange-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-xl">
            <Table className="w-6 h-6 text-orange-600" />
            <span>Game Table ({displaySets.length} sets)</span>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {manipulationInProgress && (
              <Badge variant="outline" className="text-orange-600 border-orange-300 animate-pulse">
                <Shuffle className="w-3 h-3 mr-1" />
                Manipulating
              </Badge>
            )}
            
            <Badge variant="secondary">
              {displaySets.reduce((total, set) => total + calculateSetPoints(set), 0)} total points
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-auto">
        <div className="space-y-4">
          {displaySets.map((set, setIndex) => {
            const validation = getSetValidation(set);
            
            return (
              <div
                key={`set-${setIndex}`}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  validation.isValid
                    ? 'bg-white/80 border-green-200 shadow-sm'
                    : 'bg-red-50 border-red-200 shadow-sm'
                } ${manipulationInProgress ? 'hover:shadow-md cursor-pointer' : ''}`}
              >
                {/* Set Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {validation.isValid ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="font-medium text-gray-700">
                      {validation.type}
                    </span>
                    <Badge 
                      variant={validation.isValid ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {validation.points} points
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Set {setIndex + 1}
                  </div>
                </div>
                
                {/* Tiles */}
                <div className="flex items-center space-x-2 flex-wrap gap-2">
                  {set.map((tile, tileIndex) => (
                    <TileComponent
                      key={`${setIndex}-${tileIndex}-${tile.id}`}
                      tile={tile}
                      size="normal"
                      className={`
                        ${!validation.isValid ? 'opacity-75' : ''}
                        ${manipulationInProgress ? 'hover:scale-105 cursor-grab' : ''}
                      `}
                      draggable={manipulationInProgress}
                    />
                  ))}
                </div>
                
                {/* Set Details */}
                {!validation.isValid && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50 rounded p-2">
                    Invalid set: Please check the tiles form a valid group or run
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Manipulation Instructions */}
        {manipulationInProgress && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Shuffle className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-800">Manipulation Mode</span>
            </div>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Drag tiles between sets to rearrange them</p>
              <p>• All sets must be valid when you finish</p>
              <p>• Click "Confirm" to save changes or "Cancel" to revert</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
