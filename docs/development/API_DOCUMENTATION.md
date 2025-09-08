# API Documentation

## Socket.io Events

This document describes all Socket.io events used in the AI Prompt Guesser Game for real-time multiplayer communication.

### Client → Server Events

#### `create_room`
Creates a new game room with the specified room ID and player name.

**Payload:**
```javascript
{
  roomId: string,     // 6-character room code (A-Z, 0-9)
  playerName: string  // Player's display name (max 20 characters)
}
```

**Response Events:**
- `room_created` - Room successfully created
- `room_error` - Room creation failed

---

#### `join_room`
Joins an existing game room as a player.

**Payload:**
```javascript
{
  roomId: string,     // 6-character room code
  playerName: string  // Player's display name (max 20 characters)
}
```

**Response Events:**
- `room_update` - Successfully joined room
- `room_not_found` - Room doesn't exist
- `name_taken` - Player name already in use
- `game_in_progress` - Cannot join active game

---

#### `join_room_as_spectator`
Joins an existing game room as a spectator (can watch but not play).

**Payload:**
```javascript
{
  roomId: string,       // 6-character room code
  spectatorName: string // Spectator's display name (max 20 characters)
}
```

**Response Events:**
- `spectator_joined` - Successfully joined as spectator
- `room_not_found` - Room doesn't exist
- `name_taken` - Spectator name already in use

---

#### `toggle_ready`
Toggles the player's ready status in the room lobby.

**Payload:**
```javascript
{
  roomId: string // 6-character room code
}
```

**Response Events:**
- `room_update` - Ready status updated

---

#### `set_max_rounds`
Sets the maximum number of rounds for the game (room creator only).

**Payload:**
```javascript
{
  roomId: string,   // 6-character room code
  maxRounds: number // Number of rounds (1-10)
}
```

**Response Events:**
- `room_update` - Max rounds updated
- `error` - Not authorized or invalid value

---

#### `submit_prompt`
Submits a text prompt for AI image generation.

**Payload:**
```javascript
{
  roomId: string, // 6-character room code
  prompt: string  // Text prompt (max 20 characters)
}
```

**Response Events:**
- `prompt_submitted` - Prompt accepted, generating image
- `image_generated` - AI image ready
- `image_generation_failed` - Image generation failed

---

#### `submit_guess`
Submits a guess for the current AI-generated image.

**Payload:**
```javascript
{
  roomId: string,     // 6-character room code
  guess: string,      // Player's guess (max 20 characters)
  playerName: string  // Player's display name
}
```

**Response Events:**
- `guess_submitted` - Guess received and scored
- `round_results` - Round completed with all scores

---

### Server → Client Events

#### `room_created`
Confirms successful room creation.

**Payload:**
```javascript
{
  roomId: string,        // 6-character room code
  players: Player[],     // Array of player objects
  spectators: Player[],  // Array of spectator objects
  gameState: string,     // Current game state
  currentRound: number,  // Current round number
  maxRounds: number,     // Maximum rounds configured
  isCreator: boolean     // True if this client is room creator
}
```

---

#### `room_update`
Updates room state including players, spectators, and game configuration.

**Payload:**
```javascript
{
  players: Player[],        // Array of player objects
  spectators: Player[],     // Array of spectator objects
  gameState: string,        // Current game state
  currentRound: number,     // Current round number
  maxRounds: number,        // Maximum rounds configured
  allReady: boolean,        // True if all players are ready
  currentPromptGiver: string // Socket ID of current prompt giver
}
```

**Player Object:**
```javascript
{
  id: string,           // Socket ID
  name: string,         // Display name
  score: number,        // Current score
  isPromptGiver: boolean, // True if currently giving prompts
  isReady: boolean,     // True if ready to start
  isRoomCreator: boolean, // True if room creator
  isConnected: boolean  // Connection status
}
```

---

#### `spectator_joined`
Confirms successful spectator join with current game state.

**Payload:**
```javascript
{
  players: Player[],        // Array of player objects
  spectators: Player[],     // Array of spectator objects
  gameState: string,        // Current game state
  currentRound: number,     // Current round number
  maxRounds: number,        // Maximum rounds configured
  currentPromptGiver: string, // Current prompt giver ID
  currentImage: string,     // Current image URL (if available)
  currentPrompt: string,    // Current prompt (if round ended)
  isSpectator: boolean      // Always true for this event
}
```

---

#### `game_started`
Signals the start of a new game with initial game state.

**Payload:**
```javascript
{
  currentPromptGiver: string, // Socket ID of first prompt giver
  players: Player[],          // Array of player objects
  round: number,              // Starting round number (1)
  gameState: string,          // Game state ('waiting_for_prompt')
  currentTurnIndex: number,   // Current turn index (0)
  turnsCompletedInRound: number, // Turns completed (0)
  totalPlayersInRound: number // Total players in rotation
}
```

---

#### `prompt_submitted`
Confirms prompt submission and indicates image generation has started.

**Payload:**
```javascript
{
  prompt: string,           // The submitted prompt
  promptGiver: string,      // Name of prompt giver
  isGenerating: boolean     // Always true
}
```

---

#### `image_generated`
Provides the AI-generated image URL and starts the guessing phase.

**Payload:**
```javascript
{
  imageUrl: string,         // URL of generated image
  prompt: string,           // Original prompt (hidden from guessers)
  gameState: string,        // 'guessing'
  timeRemaining: number     // Seconds remaining for guessing (30)
}
```

---

#### `guess_submitted`
Acknowledges a guess submission with scoring information.

**Payload:**
```javascript
{
  playerName: string,       // Name of guessing player
  guess: string,            // The submitted guess
  similarity: number,       // Similarity score (0-100)
  points: number,           // Points awarded
  isCorrect: boolean        // True if similarity > 80%
}
```

---

#### `round_results`
Shows complete round results with all guesses and scores.

**Payload:**
```javascript
{
  originalPrompt: string,   // The original prompt
  promptGiver: string,      // Name of prompt giver
  guesses: GuessResult[],   // Array of all guesses with scores
  updatedPlayers: Player[], // Players with updated scores
  nextPromptGiver: string,  // Next player to give prompts
  isGameFinished: boolean,  // True if this was the last round
  gameState: string         // Next game state
}
```

**GuessResult Object:**
```javascript
{
  playerName: string,       // Name of guessing player
  guess: string,            // The submitted guess
  similarity: number,       // Similarity percentage (0-100)
  points: number,           // Points awarded for this guess
  rank: number              // Ranking among all guesses (1 = best)
}
```

---

#### `next_turn`
Signals the start of the next player's turn.

**Payload:**
```javascript
{
  round: number,              // Current round number
  maxRounds: number,          // Maximum rounds configured
  currentPromptGiver: string, // Socket ID of new prompt giver
  players: Player[],          // Updated player array
  gameState: string,          // 'waiting_for_prompt'
  currentTurnIndex: number,   // New turn index
  turnsCompletedInRound: number, // Turns completed in round
  totalPlayersInRound: number // Total players in rotation
}
```

---

#### `game_finished`
Signals game completion with final results and winner.

**Payload:**
```javascript
{
  finalScores: Player[],    // Players sorted by final score
  winner: Player,           // Winning player object
  gameStats: {
    totalRounds: number,    // Total rounds played
    totalGuesses: number,   // Total guesses submitted
    averageScore: number    // Average score across all players
  }
}
```

---

#### Timer Events

#### `prompt_timer_update`
Updates the prompt submission timer.

**Payload:**
```javascript
{
  timeRemaining: number     // Seconds remaining (0-30)
}
```

#### `round_timer_update`
Updates the guessing phase timer.

**Payload:**
```javascript
{
  timeRemaining: number     // Seconds remaining (0-30)
}
```

---

### Error Events

#### `room_not_found`
Room with specified ID doesn't exist.

**Payload:**
```javascript
{
  message: string           // Error description
}
```

#### `room_error`
General room operation error.

**Payload:**
```javascript
{
  message: string           // Error description
}
```

#### `game_in_progress`
Cannot join room because game is already active.

**Payload:**
```javascript
{
  message: string           // Error description
}
```

#### `name_taken`
Player/spectator name already in use in the room.

**Payload:**
```javascript
{
  message: string           // Error description
}
```

#### `image_generation_failed`
AI image generation failed.

**Payload:**
```javascript
{
  message: string,          // Error description
  canRetry: boolean         // Whether retry is allowed
}
```

---

## REST API Endpoints

### `GET /api/health`
Health check endpoint for monitoring.

**Response:**
```javascript
{
  status: string,           // 'ok' or 'error'
  timestamp: string,        // ISO timestamp
  rooms: number,            // Number of active rooms
  uptime: number            // Server uptime in seconds
}
```

### `GET /api/costs`
AI usage and cost statistics.

**Response:**
```javascript
{
  totalImages: number,      // Total images generated
  totalCost: string,        // Total cost in USD
  breakdown: [{
    provider: string,       // Provider name
    images: number,         // Images from this provider
    cost: string,           // Cost from this provider
    percentage: string      // Percentage of total usage
  }]
}
```

### `GET /api/analytics`
Game analytics and statistics.

**Response:**
```javascript
{
  totalGames: number,       // Total games played
  totalPlayers: number,     // Total players served
  totalRounds: number,      // Total rounds completed
  totalPrompts: number,     // Total prompts submitted
  totalGuesses: number,     // Total guesses submitted
  activeRooms: number,      // Currently active rooms
  totalActivePlayers: number, // Currently active players
  dailyStats: {
    "YYYY-MM-DD": {
      games: number,        // Games on this date
      players: number       // Players on this date
    }
  }
}
```

---

## Game State Machine

The game follows a strict state machine pattern:

```
waiting → waiting_for_prompt → guessing → round_results → [next_turn|finished]
```

### State Descriptions

- **waiting**: Lobby state, waiting for players to join and ready up
- **waiting_for_prompt**: Waiting for current player to submit a prompt
- **guessing**: AI image displayed, players submitting guesses
- **round_results**: Showing round results and scores
- **finished**: Game completed, showing final results

### State Transitions

1. **waiting → waiting_for_prompt**: All players ready, game starts
2. **waiting_for_prompt → guessing**: Valid prompt submitted, image generated
3. **guessing → round_results**: Timer expires or all players guessed
4. **round_results → waiting_for_prompt**: Next player's turn (if game continues)
5. **round_results → finished**: All rounds completed

---

## Error Handling

All Socket.io events include comprehensive error handling:

- **Input Validation**: All payloads validated before processing
- **State Validation**: Events only processed in valid game states
- **Rate Limiting**: Prevents spam and abuse
- **Graceful Degradation**: Game continues even if players disconnect
- **Timeout Handling**: Automatic progression if players don't respond

## Security Considerations

- **Input Sanitization**: All text inputs sanitized to prevent XSS
- **Room Code Validation**: Strict format validation for room codes
- **Rate Limiting**: Per-socket rate limiting on all events
- **CORS Configuration**: Proper CORS setup for production deployment
- **API Key Protection**: Environment variables for sensitive configuration