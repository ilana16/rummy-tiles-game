// Enhanced AI Bot logic for different difficulty levels
import { 
  isValidSet, 
  isValidGroup, 
  isValidRun, 
  calculateSetPoints, 
  findAllPossibleSets,
  AI_DIFFICULTY 
} from './gameLogic.js';

// AI Bot class for managing bot behavior
export class AIBot {
  constructor(difficulty = AI_DIFFICULTY.MEDIUM) {
    this.difficulty = difficulty;
    this.thinkingTime = this.getThinkingTime();
  }

  getThinkingTime() {
    switch (this.difficulty) {
      case AI_DIFFICULTY.EASY:
        return 2000 + Math.random() * 2000; // 2-4 seconds
      case AI_DIFFICULTY.MEDIUM:
        return 1500 + Math.random() * 1500; // 1.5-3 seconds
      case AI_DIFFICULTY.HARD:
        return 1000 + Math.random() * 1000; // 1-2 seconds
      default:
        return 2000;
    }
  }

  // Main decision-making function
  async makeMove(playerHand, tableState, hasInitialMeld, poolSize) {
    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, this.thinkingTime));

    switch (this.difficulty) {
      case AI_DIFFICULTY.EASY:
        return this.makeEasyMove(playerHand, tableState, hasInitialMeld, poolSize);
      case AI_DIFFICULTY.MEDIUM:
        return this.makeMediumMove(playerHand, tableState, hasInitialMeld, poolSize);
      case AI_DIFFICULTY.HARD:
        return this.makeHardMove(playerHand, tableState, hasInitialMeld, poolSize);
      default:
        return this.makeEasyMove(playerHand, tableState, hasInitialMeld, poolSize);
    }
  }

  // Easy AI: Basic play, no manipulation
  makeEasyMove(playerHand, tableState, hasInitialMeld, poolSize) {
    const possibleSets = findAllPossibleSets(playerHand);
    
    if (!hasInitialMeld) {
      // Try to make initial meld
      const validInitialSets = possibleSets.filter(set => calculateSetPoints(set) >= 30);
      if (validInitialSets.length > 0) {
        const selectedSet = validInitialSets[0];
        return {
          type: 'play_set',
          tileIds: selectedSet.map(tile => tile.id)
        };
      }
    } else {
      // Play any valid set
      if (possibleSets.length > 0) {
        const selectedSet = possibleSets[0];
        return {
          type: 'play_set',
          tileIds: selectedSet.map(tile => tile.id)
        };
      }
    }

    // Can't play, draw tile
    return { type: 'draw' };
  }

  // Medium AI: Smarter set selection, basic manipulation
  makeMediumMove(playerHand, tableState, hasInitialMeld, poolSize) {
    const possibleSets = findAllPossibleSets(playerHand);
    
    if (!hasInitialMeld) {
      // Try to make efficient initial meld
      const validInitialSets = possibleSets.filter(set => calculateSetPoints(set) >= 30);
      if (validInitialSets.length > 0) {
        // Choose set that uses fewest tiles but meets requirement
        const bestSet = validInitialSets.reduce((best, current) => {
          const bestEfficiency = calculateSetPoints(best) / best.length;
          const currentEfficiency = calculateSetPoints(current) / current.length;
          return currentEfficiency > bestEfficiency ? current : best;
        });
        
        return {
          type: 'play_set',
          tileIds: bestSet.map(tile => tile.id)
        };
      }
    } else {
      // Try manipulation first if beneficial
      const manipulationMove = this.tryBasicManipulation(playerHand, tableState);
      if (manipulationMove) {
        return manipulationMove;
      }

      // Play best available set
      if (possibleSets.length > 0) {
        const bestSet = this.chooseBestSet(possibleSets, playerHand.length);
        return {
          type: 'play_set',
          tileIds: bestSet.map(tile => tile.id)
        };
      }
    }

    // Strategic drawing decision
    if (this.shouldDraw(playerHand, poolSize)) {
      return { type: 'draw' };
    }

    return { type: 'draw' };
  }

  // Hard AI: Advanced manipulation, strategic play
  makeHardMove(playerHand, tableState, hasInitialMeld, poolSize) {
    const possibleSets = findAllPossibleSets(playerHand);
    
    if (!hasInitialMeld) {
      // Optimal initial meld strategy
      const validInitialSets = possibleSets.filter(set => calculateSetPoints(set) >= 30);
      if (validInitialSets.length > 0) {
        // Choose set that maximizes future opportunities
        const bestSet = this.chooseOptimalInitialSet(validInitialSets, playerHand);
        return {
          type: 'play_set',
          tileIds: bestSet.map(tile => tile.id)
        };
      }
    } else {
      // Advanced manipulation
      const manipulationMove = this.tryAdvancedManipulation(playerHand, tableState);
      if (manipulationMove) {
        return manipulationMove;
      }

      // Strategic set play
      if (possibleSets.length > 0) {
        const strategicSet = this.chooseStrategicSet(possibleSets, playerHand, tableState);
        return {
          type: 'play_set',
          tileIds: strategicSet.map(tile => tile.id)
        };
      }
    }

    // Advanced drawing strategy
    if (this.shouldDrawStrategically(playerHand, tableState, poolSize)) {
      return { type: 'draw' };
    }

    return { type: 'draw' };
  }

  // Helper methods for AI decision making

  chooseBestSet(possibleSets, handSize) {
    // Prefer sets that reduce hand size most efficiently
    return possibleSets.reduce((best, current) => {
      const bestScore = this.calculateSetScore(best, handSize);
      const currentScore = this.calculateSetScore(current, handSize);
      return currentScore > bestScore ? current : best;
    });
  }

  calculateSetScore(set, handSize) {
    const points = calculateSetPoints(set);
    const efficiency = points / set.length;
    const handReduction = set.length / handSize;
    
    // Balance points, efficiency, and hand reduction
    return points * 0.4 + efficiency * 0.3 + handReduction * 0.3;
  }

  chooseOptimalInitialSet(validSets, playerHand) {
    // Choose set that leaves best remaining tiles
    return validSets.reduce((best, current) => {
      const bestRemainingScore = this.evaluateRemainingTiles(playerHand, best);
      const currentRemainingScore = this.evaluateRemainingTiles(playerHand, current);
      return currentRemainingScore > bestRemainingScore ? current : best;
    });
  }

  evaluateRemainingTiles(playerHand, usedSet) {
    const usedTileIds = new Set(usedSet.map(tile => tile.id));
    const remainingTiles = playerHand.filter(tile => !usedTileIds.has(tile.id));
    
    // Score based on potential for future sets
    let score = 0;
    
    // Group tiles by color and number for analysis
    const byColor = {};
    const byNumber = {};
    
    remainingTiles.forEach(tile => {
      if (!tile.isJoker) {
        if (!byColor[tile.color]) byColor[tile.color] = [];
        if (!byNumber[tile.number]) byNumber[tile.number] = [];
        byColor[tile.color].push(tile);
        byNumber[tile.number].push(tile);
      }
    });

    // Score potential runs
    Object.values(byColor).forEach(colorTiles => {
      if (colorTiles.length >= 2) {
        score += colorTiles.length * 2;
      }
    });

    // Score potential groups
    Object.values(byNumber).forEach(numberTiles => {
      if (numberTiles.length >= 2) {
        score += numberTiles.length * 3;
      }
    });

    return score;
  }

  chooseStrategicSet(possibleSets, playerHand, tableState) {
    // Advanced set selection considering table state
    return possibleSets.reduce((best, current) => {
      const bestScore = this.calculateStrategicScore(best, playerHand, tableState);
      const currentScore = this.calculateStrategicScore(current, playerHand, tableState);
      return currentScore > bestScore ? current : best;
    });
  }

  calculateStrategicScore(set, playerHand, tableState) {
    let score = this.calculateSetScore(set, playerHand.length);
    
    // Bonus for sets that might enable future manipulation
    const manipulationPotential = this.evaluateManipulationPotential(set, tableState);
    score += manipulationPotential * 0.2;
    
    // Bonus for using jokers efficiently
    const jokerEfficiency = this.evaluateJokerUsage(set);
    score += jokerEfficiency * 0.1;
    
    return score;
  }

  evaluateManipulationPotential(set, tableState) {
    // Simple heuristic: sets with common numbers/colors have more potential
    let potential = 0;
    
    set.forEach(tile => {
      if (!tile.isJoker) {
        tableState.forEach(tableSet => {
          tableSet.forEach(tableTile => {
            if (!tableTile.isJoker) {
              if (tableTile.number === tile.number || tableTile.color === tile.color) {
                potential += 1;
              }
            }
          });
        });
      }
    });
    
    return potential;
  }

  evaluateJokerUsage(set) {
    const jokerCount = set.filter(tile => tile.isJoker).length;
    if (jokerCount === 0) return 0;
    
    const setPoints = calculateSetPoints(set);
    // Prefer using jokers in high-value sets
    return setPoints / (jokerCount * 30); // 30 is joker penalty
  }

  tryBasicManipulation(playerHand, tableState) {
    // Medium AI: Try simple manipulations
    // Look for opportunities to add tiles to existing sets
    
    for (const tile of playerHand) {
      if (tile.isJoker) continue;
      
      for (let setIndex = 0; setIndex < tableState.length; setIndex++) {
        const tableSet = tableState[setIndex];
        
        // Try adding to group
        if (this.canAddToGroup(tile, tableSet)) {
          return {
            type: 'manipulate',
            action: 'add_to_set',
            tileId: tile.id,
            setIndex: setIndex
          };
        }
        
        // Try adding to run
        if (this.canAddToRun(tile, tableSet)) {
          return {
            type: 'manipulate',
            action: 'add_to_set',
            tileId: tile.id,
            setIndex: setIndex
          };
        }
      }
    }
    
    return null;
  }

  tryAdvancedManipulation(playerHand, tableState) {
    // Hard AI: Try complex manipulations
    // This is a simplified version - full implementation would be much more complex
    
    // Try basic manipulation first
    const basicMove = this.tryBasicManipulation(playerHand, tableState);
    if (basicMove) return basicMove;
    
    // Try splitting sets and recombining
    for (let setIndex = 0; setIndex < tableState.length; setIndex++) {
      const tableSet = tableState[setIndex];
      
      if (tableSet.length === 4 && isValidGroup(tableSet)) {
        // Try removing one tile from group of 4 to use elsewhere
        const splitMove = this.trySplitGroup(tableSet, setIndex, playerHand, tableState);
        if (splitMove) return splitMove;
      }
      
      if (tableSet.length > 3 && isValidRun(tableSet)) {
        // Try splitting run
        const splitMove = this.trySplitRun(tableSet, setIndex, playerHand, tableState);
        if (splitMove) return splitMove;
      }
    }
    
    return null;
  }

  canAddToGroup(tile, tableSet) {
    if (!isValidGroup(tableSet)) return false;
    
    const testSet = [...tableSet, tile];
    return isValidGroup(testSet);
  }

  canAddToRun(tile, tableSet) {
    if (!isValidRun(tableSet)) return false;
    
    const testSet = [...tableSet, tile];
    return isValidRun(testSet);
  }

  trySplitGroup(tableSet, setIndex, playerHand, tableState) {
    // Try removing each tile from the group and see if it enables a play
    for (let i = 0; i < tableSet.length; i++) {
      const removedTile = tableSet[i];
      const remainingSet = tableSet.filter((_, index) => index !== i);
      
      if (isValidGroup(remainingSet)) {
        // Check if removed tile can form new set with hand tiles
        const newSetTiles = [removedTile, ...playerHand];
        const newPossibleSets = findAllPossibleSets(newSetTiles);
        
        if (newPossibleSets.length > 0) {
          return {
            type: 'manipulate',
            action: 'split_and_recombine',
            sourceSetIndex: setIndex,
            removeTileIndex: i,
            newSet: newPossibleSets[0]
          };
        }
      }
    }
    
    return null;
  }

  trySplitRun(tableSet, setIndex, playerHand, tableState) {
    // Simplified run splitting logic
    if (tableSet.length <= 3) return null;
    
    // Try splitting in the middle
    const midPoint = Math.floor(tableSet.length / 2);
    const firstHalf = tableSet.slice(0, midPoint);
    const secondHalf = tableSet.slice(midPoint);
    
    if (isValidRun(firstHalf) && isValidRun(secondHalf)) {
      // Check if this split enables new plays
      const combinedTiles = [...playerHand];
      const newPossibleSets = findAllPossibleSets(combinedTiles);
      
      if (newPossibleSets.length > 0) {
        return {
          type: 'manipulate',
          action: 'split_run',
          setIndex: setIndex,
          splitPoint: midPoint
        };
      }
    }
    
    return null;
  }

  shouldDraw(playerHand, poolSize) {
    // Medium AI drawing strategy
    if (poolSize <= 10) return false; // Don't draw when pool is low
    
    const handSize = playerHand.length;
    const possibleSets = findAllPossibleSets(playerHand);
    
    // Draw if hand is small and no immediate plays
    if (handSize <= 8 && possibleSets.length === 0) return true;
    
    // Draw if we have many tiles but few play options
    if (handSize >= 12 && possibleSets.length <= 1) return true;
    
    return Math.random() < 0.3; // 30% chance to draw otherwise
  }

  shouldDrawStrategically(playerHand, tableState, poolSize) {
    // Hard AI strategic drawing
    if (poolSize <= 5) return false; // Very conservative when pool is low
    
    const handAnalysis = this.analyzeHand(playerHand);
    const tableAnalysis = this.analyzeTable(tableState);
    
    // Complex decision based on hand composition and table state
    const drawScore = this.calculateDrawScore(handAnalysis, tableAnalysis, poolSize);
    
    return drawScore > 0.5;
  }

  analyzeHand(playerHand) {
    const analysis = {
      totalTiles: playerHand.length,
      jokers: playerHand.filter(t => t.isJoker).length,
      byColor: {},
      byNumber: {},
      potentialSets: 0
    };
    
    playerHand.forEach(tile => {
      if (!tile.isJoker) {
        if (!analysis.byColor[tile.color]) analysis.byColor[tile.color] = 0;
        if (!analysis.byNumber[tile.number]) analysis.byNumber[tile.number] = 0;
        analysis.byColor[tile.color]++;
        analysis.byNumber[tile.number]++;
      }
    });
    
    // Count potential sets
    Object.values(analysis.byColor).forEach(count => {
      if (count >= 2) analysis.potentialSets++;
    });
    
    Object.values(analysis.byNumber).forEach(count => {
      if (count >= 2) analysis.potentialSets++;
    });
    
    return analysis;
  }

  analyzeTable(tableState) {
    return {
      totalSets: tableState.length,
      totalTiles: tableState.reduce((sum, set) => sum + set.length, 0),
      manipulationOpportunities: this.countManipulationOpportunities(tableState)
    };
  }

  countManipulationOpportunities(tableState) {
    let opportunities = 0;
    
    tableState.forEach(set => {
      if (set.length === 4) opportunities++; // Can split groups of 4
      if (set.length > 4) opportunities += 2; // Can split long runs multiple ways
    });
    
    return opportunities;
  }

  calculateDrawScore(handAnalysis, tableAnalysis, poolSize) {
    let score = 0;
    
    // Favor drawing with fewer tiles
    score += (14 - handAnalysis.totalTiles) * 0.1;
    
    // Favor drawing with fewer potential sets
    score += (5 - handAnalysis.potentialSets) * 0.2;
    
    // Favor drawing when pool is large
    score += Math.min(poolSize / 50, 0.3);
    
    // Favor drawing when table has manipulation opportunities
    score += tableAnalysis.manipulationOpportunities * 0.1;
    
    return Math.max(0, Math.min(1, score));
  }
}

// Factory function to create AI bot
export function createAIBot(difficulty) {
  return new AIBot(difficulty);
}
