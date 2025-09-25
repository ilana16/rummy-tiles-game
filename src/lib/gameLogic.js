// Core game logic for Rummy Tiles

export const COLORS = {
  RED: 'red',
  BLUE: 'blue',
  YELLOW: 'yellow',
  BLACK: 'black'
};

export const TILE_TYPES = {
  NUMBER: 'number',
  JOKER: 'joker'
};

// Create a complete set of 106 tiles
export function createTileSet() {
  const tiles = [];
  let id = 0;

  // Create 8 sets of numbered tiles (1-13 in each color, appearing twice)
  for (let set = 0; set < 2; set++) {
    for (let number = 1; number <= 13; number++) {
      Object.values(COLORS).forEach(color => {
        tiles.push({
          id: id++,
          type: TILE_TYPES.NUMBER,
          number,
          color,
          isJoker: false
        });
      });
    }
  }

  // Add 2 joker tiles
  for (let i = 0; i < 2; i++) {
    tiles.push({
      id: id++,
      type: TILE_TYPES.JOKER,
      number: null,
      color: null,
      isJoker: true
    });
  }

  return tiles;
}

// Shuffle tiles using Fisher-Yates algorithm
export function shuffleTiles(tiles) {
  const shuffled = [...tiles];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Deal initial tiles to players
export function dealInitialTiles(shuffledTiles, playerCount) {
  const hands = Array(playerCount).fill(null).map(() => []);
  const tilesPerPlayer = 14;
  
  for (let i = 0; i < tilesPerPlayer; i++) {
    for (let player = 0; player < playerCount; player++) {
      hands[player].push(shuffledTiles.pop());
    }
  }
  
  return {
    hands,
    pool: shuffledTiles
  };
}

// Check if tiles form a valid group (3-4 same numbers, different colors)
export function isValidGroup(tiles) {
  if (tiles.length < 3 || tiles.length > 4) return false;
  
  const numbers = new Set();
  const colors = new Set();
  
  for (const tile of tiles) {
    if (tile.isJoker) continue; // Jokers can represent any tile
    
    numbers.add(tile.number);
    colors.add(tile.color);
  }
  
  // All non-joker tiles must have the same number
  if (numbers.size > 1) return false;
  
  // All tiles must have different colors (accounting for jokers)
  const nonJokerCount = tiles.filter(t => !t.isJoker).length;
  if (colors.size !== nonJokerCount) return false;
  
  return true;
}

// Check if tiles form a valid run (3+ consecutive numbers, same color)
export function isValidRun(tiles) {
  if (tiles.length < 3) return false;
  
  // Separate jokers from regular tiles
  const regularTiles = tiles.filter(t => !t.isJoker);
  const jokerCount = tiles.length - regularTiles.length;
  
  if (regularTiles.length === 0) return false; // Can't have all jokers
  
  // All regular tiles must be same color
  const colors = new Set(regularTiles.map(t => t.color));
  if (colors.size > 1) return false;
  
  // Sort regular tiles by number
  const sortedNumbers = regularTiles.map(t => t.number).sort((a, b) => a - b);
  
  // Check if we can fill gaps with jokers to make consecutive sequence
  let gapsNeeded = 0;
  for (let i = 1; i < sortedNumbers.length; i++) {
    const gap = sortedNumbers[i] - sortedNumbers[i - 1] - 1;
    if (gap < 0) return false; // Duplicate numbers
    gapsNeeded += gap;
  }
  
  // Check if we have enough jokers to fill gaps
  if (gapsNeeded > jokerCount) return false;
  
  // Special case: check for wrap-around with 1 (1 can follow 13)
  const hasOne = sortedNumbers.includes(1);
  const hasThirteen = sortedNumbers.includes(13);
  
  if (hasOne && hasThirteen) {
    // Check if it's a valid wrap-around sequence
    const withoutOne = sortedNumbers.filter(n => n !== 1);
    const withoutThirteen = sortedNumbers.filter(n => n !== 13);
    
    // Try both interpretations: 1 as low or 1 as high
    const lowInterpretation = isConsecutiveWithJokers([1, ...withoutOne.filter(n => n !== 13)], jokerCount);
    const highInterpretation = isConsecutiveWithJokers([...withoutThirteen.filter(n => n !== 1), 14], jokerCount); // Treat 1 as 14
    
    return lowInterpretation || highInterpretation;
  }
  
  return isConsecutiveWithJokers(sortedNumbers, jokerCount);
}

// Helper function to check if numbers can be made consecutive with jokers
function isConsecutiveWithJokers(numbers, jokerCount) {
  if (numbers.length === 0) return false;
  
  let gapsNeeded = 0;
  for (let i = 1; i < numbers.length; i++) {
    const gap = numbers[i] - numbers[i - 1] - 1;
    if (gap < 0) return false; // Duplicate numbers
    gapsNeeded += gap;
  }
  
  return gapsNeeded <= jokerCount;
}

// Check if a set (group or run) is valid
export function isValidSet(tiles) {
  if (!tiles || tiles.length < 3) return false;
  return isValidGroup(tiles) || isValidRun(tiles);
}

// Calculate points for a set of tiles
export function calculateSetPoints(tiles) {
  return tiles.reduce((total, tile) => {
    if (tile.isJoker) {
      // Joker value depends on what it represents in the set
      return total + getJokerValue(tile, tiles);
    }
    return total + tile.number;
  }, 0);
}

// Get the value a joker represents in a set
function getJokerValue(joker, tiles) {
  const regularTiles = tiles.filter(t => !t.isJoker);
  
  if (regularTiles.length === 0) return 1; // Default value
  
  // For groups, joker takes the same number as other tiles
  if (isValidGroup(tiles)) {
    return regularTiles[0].number;
  }
  
  // For runs, determine what number the joker represents
  if (isValidRun(tiles)) {
    // This is a simplified approach - in a real game, you'd need to track
    // what the joker was placed as when it was put down
    const numbers = regularTiles.map(t => t.number).sort((a, b) => a - b);
    
    // Find gaps and assign joker to fill them
    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i] - numbers[i - 1] > 1) {
        return numbers[i - 1] + 1;
      }
    }
    
    // If no gaps, joker extends the sequence
    return Math.max(...numbers) + 1;
  }
  
  return 1; // Default value
}

// Check if player can make initial meld (30+ points)
export function canMakeInitialMeld(tiles, tableState) {
  // Player must use only tiles from their rack for initial meld
  const possibleSets = findAllPossibleSets(tiles);
  
  // Try all combinations of sets that total 30+ points
  return findCombinationWithMinPoints(possibleSets, 30);
}

// Find all possible valid sets from given tiles
export function findAllPossibleSets(tiles) {
  const sets = [];
  
  // Try all combinations of 3+ tiles
  for (let size = 3; size <= tiles.length; size++) {
    const combinations = getCombinations(tiles, size);
    for (const combo of combinations) {
      if (isValidSet(combo)) {
        sets.push(combo);
      }
    }
  }
  
  return sets;
}

// Get all combinations of specified size from array
function getCombinations(arr, size) {
  if (size === 1) return arr.map(item => [item]);
  if (size > arr.length) return [];
  
  const combinations = [];
  
  for (let i = 0; i <= arr.length - size; i++) {
    const head = arr[i];
    const tailCombos = getCombinations(arr.slice(i + 1), size - 1);
    
    for (const tailCombo of tailCombos) {
      combinations.push([head, ...tailCombo]);
    }
  }
  
  return combinations;
}

// Find combination of sets that meets minimum points requirement
function findCombinationWithMinPoints(sets, minPoints) {
  // This is a simplified version - a full implementation would use
  // dynamic programming to find optimal combinations
  
  for (const set of sets) {
    if (calculateSetPoints(set) >= minPoints) {
      return true;
    }
  }
  
  // Try combinations of 2 sets
  for (let i = 0; i < sets.length; i++) {
    for (let j = i + 1; j < sets.length; j++) {
      const combinedTiles = [...sets[i], ...sets[j]];
      const uniqueTiles = new Set(combinedTiles.map(t => t.id));
      
      // Check if sets don't share tiles
      if (uniqueTiles.size === combinedTiles.length) {
        const totalPoints = calculateSetPoints(sets[i]) + calculateSetPoints(sets[j]);
        if (totalPoints >= minPoints) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// Validate entire table state (all sets must be valid)
export function validateTableState(tableSets) {
  return tableSets.every(set => isValidSet(set));
}

// Check if game is won (player has no tiles left)
export function isGameWon(playerHand) {
  return playerHand.length === 0;
}

// Calculate final scores when game ends
export function calculateFinalScores(playerHands) {
  const scores = playerHands.map(hand => {
    return hand.reduce((total, tile) => {
      if (tile.isJoker) return total + 30; // Joker penalty
      return total + tile.number;
    }, 0);
  });
  
  // Winner gets positive score equal to sum of others' penalties
  const minScore = Math.min(...scores);
  const winnerIndex = scores.indexOf(minScore);
  const totalPenalties = scores.reduce((sum, score, index) => {
    return index === winnerIndex ? sum : sum + score;
  }, 0);
  
  return scores.map((score, index) => {
    return index === winnerIndex ? totalPenalties : -score;
  });
}

// AI difficulty levels
export const AI_DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

// Basic AI move generation (placeholder for more sophisticated AI)
export function generateAIMove(playerHand, tableState, difficulty) {
  const possibleSets = findAllPossibleSets(playerHand);
  
  switch (difficulty) {
    case AI_DIFFICULTY.EASY:
      // Easy AI: Only plays obvious sets, doesn't manipulate
      return possibleSets.length > 0 ? { type: 'play_set', set: possibleSets[0] } : { type: 'draw' };
      
    case AI_DIFFICULTY.MEDIUM:
      // Medium AI: Plays sets and does basic manipulation
      // TODO: Implement basic manipulation logic
      return possibleSets.length > 0 ? { type: 'play_set', set: possibleSets[0] } : { type: 'draw' };
      
    case AI_DIFFICULTY.HARD:
      // Hard AI: Advanced manipulation and strategic play
      // TODO: Implement advanced AI logic
      return possibleSets.length > 0 ? { type: 'play_set', set: possibleSets[0] } : { type: 'draw' };
      
    default:
      return { type: 'draw' };
  }
}
