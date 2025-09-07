require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const aiService = require('./aiService');
const costTracker = require('./costTracker');

// Debug environment variables
console.log('Current working directory:', process.cwd());
console.log('AI_PROVIDER from env:', process.env.AI_PROVIDER);
console.log('TOGETHER_API_KEY exists:', !!process.env.TOGETHER_API_KEY);

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? ["https://kirohackathon-production.up.railway.app", "https://imprompt.to", "https://www.imprompt.to"] 
            : "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ["https://kirohackathon-production.up.railway.app", "https://imprompt.to", "https://www.imprompt.to"] 
        : "http://localhost:3000",
    credentials: true
}));
app.use(express.json());

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static('client/build'));
    
    // Handle React routing - send all non-API requests to React
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
    });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        rooms: rooms.size,
        uptime: process.uptime()
    });
});

// Cost monitoring endpoint
app.get('/api/costs', (req, res) => {
    res.json(costTracker.getUsageStats());
});

// Game state
const rooms = new Map();
const GAME_CONFIG = {
    ROUND_TIME: 30, // seconds for guessing phase
    PROMPT_TIME: 30, // seconds for prompt submission
    MAX_PROMPT_CHARS: 20, // character limit for prompts
    POINTS_FOR_EXACT_MATCH: 100,
    POINTS_FOR_CLOSE_MATCH: 50
};

class GameRoom {
    constructor(id) {
        this.id = id;
        this.players = new Map();
        this.spectators = new Map(); // New: track spectators separately
        this.currentRound = 0;
        this.maxRounds = 5; // Default value
        this.roomCreator = null; // Track who created the room
        this.currentPromptGiver = null;
        this.currentPrompt = '';
        this.currentImage = '';
        this.guesses = new Map();
        this.isAutoSubmittedPrompt = false; // Track if prompt was auto-submitted
        this.roundStartTime = null;
        this.promptStartTime = null;
        this.gameState = 'waiting'; // waiting, waiting_for_prompt, guessing, round_results, finished
        this.playerOrder = []; // Array to track turn order
        this.currentTurnIndex = 0; // Track which player's turn it is within the round
        this.turnsCompletedInRound = 0; // Track how many turns completed in current round
        this.promptTimer = null; // Store prompt timer reference
        this.roundTimer = null; // Store round timer reference
    }

    addPlayer(socketId, playerName) {
        // Set the first player as room creator
        if (this.players.size === 0) {
            this.roomCreator = socketId;
        }

        this.players.set(socketId, {
            id: socketId,
            name: playerName,
            score: 0,
            isPromptGiver: false,
            isReady: false,
            isRoomCreator: socketId === this.roomCreator,
            isConnected: true
        });
    }

    addSpectator(socketId, spectatorName) {
        this.spectators.set(socketId, {
            id: socketId,
            name: spectatorName,
            isSpectator: true,
            isConnected: true
        });
    }

    removePlayer(socketId) {
        this.players.delete(socketId);
    }

    removeSpectator(socketId) {
        this.spectators.delete(socketId);
    }

    setPlayerOrder() {
        this.playerOrder = Array.from(this.players.keys());
        console.log('Player order set:', this.playerOrder);
    }

    getNextPromptGiver() {
        if (this.playerOrder.length === 0) return null;

        const currentIndex = this.playerOrder.indexOf(this.currentPromptGiver);
        const nextIndex = (currentIndex + 1) % this.playerOrder.length;
        const nextPromptGiver = this.playerOrder[nextIndex];

        console.log('Turn rotation:', {
            playerOrder: this.playerOrder,
            currentPromptGiver: this.currentPromptGiver,
            currentIndex,
            nextIndex,
            nextPromptGiver
        });

        return nextPromptGiver;
    }

    startNewRound() {
        // Initialize first round
        this.currentRound = 1;
        this.currentTurnIndex = 0;
        this.turnsCompletedInRound = 0;

        // Set first player as prompt giver
        this.currentPromptGiver = this.playerOrder[0];

        this.guesses.clear();
        this.currentPrompt = '';
        this.currentImage = '';
        this.isAutoSubmittedPrompt = false;
        this.promptStartTime = null;
        this.roundStartTime = null;

        // Update player roles
        this.players.forEach((player, id) => {
            player.isPromptGiver = id === this.currentPromptGiver;
        });

        this.gameState = 'waiting_for_prompt';

        console.log('Starting new game:', {
            currentRound: this.currentRound,
            currentTurnIndex: this.currentTurnIndex,
            turnsCompletedInRound: this.turnsCompletedInRound,
            totalPlayers: this.playerOrder.length,
            currentPromptGiver: this.currentPromptGiver
        });
    }

    nextTurn() {
        // Move to next player's turn
        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.playerOrder.length;
        this.turnsCompletedInRound++;

        // Check if we've completed a full round (everyone has had a turn)
        if (this.turnsCompletedInRound >= this.playerOrder.length) {
            this.currentRound++;
            this.turnsCompletedInRound = 0;
            this.currentTurnIndex = 0; // Start from first player again
        }

        this.currentPromptGiver = this.playerOrder[this.currentTurnIndex];
        this.guesses.clear();
        this.currentPrompt = '';
        this.currentImage = '';
        this.isAutoSubmittedPrompt = false;
        this.promptStartTime = null;
        this.roundStartTime = null;

        // Update player roles
        this.players.forEach((player, id) => {
            player.isPromptGiver = id === this.currentPromptGiver;
        });

        this.gameState = 'waiting_for_prompt';

        console.log('Turn rotation:', {
            currentRound: this.currentRound,
            currentTurnIndex: this.currentTurnIndex,
            turnsCompletedInRound: this.turnsCompletedInRound,
            totalPlayers: this.playerOrder.length,
            currentPromptGiver: this.currentPromptGiver
        });
    }

    startPromptTimer() {
        this.promptStartTime = Date.now();
        this.gameState = 'waiting_for_prompt';
    }

    startRoundTimer() {
        this.roundStartTime = Date.now();
        this.gameState = 'guessing';
    }

    getPromptTimeRemaining() {
        if (!this.promptStartTime) return GAME_CONFIG.PROMPT_TIME;
        const elapsed = Math.floor((Date.now() - this.promptStartTime) / 1000);
        return Math.max(0, GAME_CONFIG.PROMPT_TIME - elapsed);
    }

    getRemainingTime() {
        if (!this.roundStartTime) return GAME_CONFIG.ROUND_TIME;
        const elapsed = Math.floor((Date.now() - this.roundStartTime) / 1000);
        return Math.max(0, GAME_CONFIG.ROUND_TIME - elapsed);
    }

    setMaxRounds(rounds) {
        // Only allow setting rounds if game hasn't started
        if (this.gameState === 'waiting') {
            this.maxRounds = Math.max(1, Math.min(10, rounds)); // Limit between 1-10 rounds
        }
    }

    isRoomCreator(socketId) {
        return this.roomCreator === socketId;
    }

    clearPromptTimer() {
        if (this.promptTimer) {
            clearInterval(this.promptTimer);
            this.promptTimer = null;
        }
    }

    clearRoundTimer() {
        if (this.roundTimer) {
            clearInterval(this.roundTimer);
            this.roundTimer = null;
        }
    }

    clearAllTimers() {
        this.clearPromptTimer();
        this.clearRoundTimer();
    }

    removePlayerFromOrder(playerId) {
        const index = this.playerOrder.indexOf(playerId);
        if (index !== -1) {
            this.playerOrder.splice(index, 1);

            // Adjust currentTurnIndex if needed
            if (index <= this.currentTurnIndex) {
                this.currentTurnIndex = Math.max(0, this.currentTurnIndex - 1);
            }

            // Make sure currentTurnIndex is within bounds
            if (this.currentTurnIndex >= this.playerOrder.length && this.playerOrder.length > 0) {
                this.currentTurnIndex = 0;
            }

            console.log(`Removed player ${playerId} from order. New order:`, this.playerOrder);
            console.log(`Updated currentTurnIndex: ${this.currentTurnIndex}`);
        }
    }
}

// Socket handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('create_room', ({ roomId, playerName }) => {
        console.log('Creating new room:', roomId, 'for player:', playerName);

        // Create new room
        const room = new GameRoom(roomId);
        rooms.set(roomId, room);

        // Add creator as first player
        room.addPlayer(socket.id, playerName);
        socket.join(roomId);

        console.log('Room created successfully. Room creator:', room.roomCreator);

        // Send room created confirmation with special flag
        socket.emit('room_created', {
            roomId: roomId,
            players: Array.from(room.players.values()),
            spectators: Array.from(room.spectators.values()),
            gameState: room.gameState,
            currentRound: room.currentRound,
            maxRounds: room.maxRounds,
            isCreator: true
        });
    });

    socket.on('join_room', ({ roomId, playerName }) => {
        console.log('Attempting to join room:', roomId, 'Player:', playerName);

        if (!rooms.has(roomId)) {
            console.log('Room not found:', roomId);
            socket.emit('room_not_found', {
                message: `Room "${roomId}" does not exist. Please check the room code or create a new room.`
            });
            return;
        }

        const room = rooms.get(roomId);

        // Check room size limit
        if (room.players.size >= 5) {
            socket.emit('error', { message: 'Room is full! Maximum 5 players allowed.' });
            return;
        }

        // Check if game has already started - prevent rejoining
        if (room.gameState !== 'waiting') {
            console.log(`Player ${playerName} tried to join room ${roomId} but game is already in progress`);
            socket.emit('game_in_progress', {
                message: 'This game is already in progress. You cannot join once a game has started. Please create or join a different room.'
            });
            return;
        }

        // Check if player with same name already exists
        let existingPlayer = null;
        for (const [playerId, player] of room.players) {
            if (player.name === playerName) {
                existingPlayer = player;
                break;
            }
        }

        if (existingPlayer) {
            console.log(`Player name ${playerName} already exists in room ${roomId}`);
            socket.emit('name_taken', {
                message: 'A player with this name is already in the room. Please choose a different name.'
            });
            return;
        }

        // Add new player
        room.addPlayer(socket.id, playerName);

        // If first player, make them prompt giver
        if (room.players.size === 1) {
            room.currentPromptGiver = socket.id;
            room.players.get(socket.id).isPromptGiver = true;
        }

        socket.join(roomId);

        // Send comprehensive room update to everyone
        const roomUpdateData = {
            players: Array.from(room.players.values()),
            spectators: Array.from(room.spectators.values()),
            gameState: room.gameState,
            currentRound: room.currentRound,
            maxRounds: room.maxRounds,
            currentPromptGiver: room.currentPromptGiver
        };

        console.log(`Emitting room_update for ${roomId}:`, roomUpdateData);
        io.to(roomId).emit('room_update', roomUpdateData);


    });

    socket.on('join_room_as_spectator', ({ roomId, spectatorName }) => {
        console.log('Spectator attempting to join room:', roomId, 'Name:', spectatorName);

        if (!rooms.has(roomId)) {
            console.log('Room not found for spectator:', roomId);
            socket.emit('room_not_found', {
                message: `Room "${roomId}" does not exist. Please check the room code.`
            });
            return;
        }

        const room = rooms.get(roomId);

        // Check if spectator name already exists
        let existingSpectator = null;
        for (const [spectatorId, spectator] of room.spectators) {
            if (spectator.name === spectatorName) {
                existingSpectator = spectator;
                break;
            }
        }

        if (existingSpectator) {
            console.log(`Spectator name ${spectatorName} already exists in room ${roomId}`);
            socket.emit('name_taken', {
                message: 'A spectator with this name is already in the room. Please choose a different name.'
            });
            return;
        }

        // Add new spectator
        room.addSpectator(socket.id, spectatorName);
        socket.join(roomId);

        // Send current game state to the spectator
        const spectatorJoinData = {
            players: Array.from(room.players.values()),
            spectators: Array.from(room.spectators.values()),
            gameState: room.gameState,
            currentRound: room.currentRound,
            maxRounds: room.maxRounds,
            currentPromptGiver: room.currentPromptGiver,
            currentImage: room.currentImage,
            currentPrompt: room.gameState === 'round_results' ? room.currentPrompt : '',
            isSpectator: true
        };

        console.log(`Spectator ${spectatorName} joined room ${roomId}`);
        socket.emit('spectator_joined', spectatorJoinData);

        // Notify all users about the new spectator
        io.to(roomId).emit('room_update', {
            players: Array.from(room.players.values()),
            spectators: Array.from(room.spectators.values()),
            gameState: room.gameState,
            currentRound: room.currentRound,
            maxRounds: room.maxRounds,
            currentPromptGiver: room.currentPromptGiver
        });
    });

    socket.on('toggle_ready', ({ roomId }) => {
        console.log('Received toggle_ready event for room:', roomId);
        const room = rooms.get(roomId);

        if (room && room.gameState === 'waiting') {
            const player = room.players.get(socket.id);
            if (player) {
                // Toggle ready status
                player.isReady = !player.isReady;
                console.log(`Player ${player.name} is now ${player.isReady ? 'ready' : 'not ready'}`);

                // Check if all players are ready
                const allPlayers = Array.from(room.players.values());
                const readyPlayers = allPlayers.filter(p => p.isReady);
                const allReady = allPlayers.length >= 2 && readyPlayers.length === allPlayers.length;

                console.log(`Ready players: ${readyPlayers.length}/${allPlayers.length}`);

                // Emit room update with ready status
                io.to(roomId).emit('room_update', {
                    players: allPlayers,
                    spectators: Array.from(room.spectators.values()),
                    gameState: room.gameState,
                    currentRound: room.currentRound,
                    maxRounds: room.maxRounds,
                    allReady: allReady
                });

                // If all players are ready, start the game
                if (allReady) {
                    console.log('All players ready! Starting game...');
                    setTimeout(() => {
                        room.setPlayerOrder(); // Set the turn order
                        room.startNewRound();
                        console.log('Room state after startNewRound:', {
                            gameState: room.gameState,
                            currentRound: room.currentRound,
                            currentPromptGiver: room.currentPromptGiver
                        });

                        const gameStartedData = {
                            currentPromptGiver: room.currentPromptGiver,
                            players: Array.from(room.players.values()),
                            round: room.currentRound,
                            gameState: room.gameState,
                            currentTurnIndex: room.currentTurnIndex,
                            turnsCompletedInRound: room.turnsCompletedInRound,
                            totalPlayersInRound: room.playerOrder.length
                        };

                        console.log('Emitting game_started to room:', roomId);
                        console.log('Game started data:', gameStartedData);
                        console.log('Sockets in room:', io.sockets.adapter.rooms.get(roomId));
                        io.to(roomId).emit('game_started', gameStartedData);
                        console.log('game_started event emitted successfully');

                        // Start prompt timer
                        room.startPromptTimer();
                        room.promptTimer = setInterval(() => {
                            const remaining = room.getPromptTimeRemaining();
                            io.to(roomId).emit('prompt_timer_update', { timeRemaining: remaining });

                            if (remaining <= 0) {
                                room.clearPromptTimer();
                                // Auto-submit a random prompt if no prompt was submitted
                                if (!room.currentPrompt) {
                                    const randomPrompts = ['cat', 'sunset', 'robot', 'flower', 'mountain'];
                                    const randomPrompt = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
                                    room.currentPrompt = randomPrompt;
                                    room.isAutoSubmittedPrompt = true; // Mark as auto-submitted
                                    console.log('Auto-submitted random prompt:', randomPrompt);
                                    // Continue with image generation...
                                    handlePromptSubmission(roomId, randomPrompt);
                                }
                            }
                        }, 1000);
                    }, 1000); // Small delay for better UX
                }
            }
        }
    });

    // Handle player leaving during active game
    function handlePlayerLeaving(room, leavingPlayerId, wasCurrentPromptGiver, roomId) {
        console.log(`Handling player leaving: ${leavingPlayerId}, was prompt giver: ${wasCurrentPromptGiver}`);

        // Remove player from playerOrder and adjust indices
        room.removePlayerFromOrder(leavingPlayerId);

        // If no players left, end the game
        if (room.playerOrder.length === 0 || room.players.size === 0) {
            console.log('No players left, ending game');
            endGame(roomId);
            return;
        }

        // If only one player left, we might want to end the game too
        if (room.playerOrder.length === 1) {
            console.log('Only one player left, ending game');
            endGame(roomId);
            return;
        }

        // If the current prompt giver left, we need to handle the current turn
        if (wasCurrentPromptGiver) {
            console.log('Current prompt giver left, handling turn transition');

            // Clear any active timers
            room.clearAllTimers();

            // Set new prompt giver
            room.currentPromptGiver = room.playerOrder[room.currentTurnIndex];

            // Update player roles
            room.players.forEach((player, id) => {
                player.isPromptGiver = id === room.currentPromptGiver;
            });

            if (room.gameState === 'waiting_for_prompt') {
                // If we were waiting for a prompt, start the new player's turn
                room.guesses.clear();
                room.currentPrompt = '';
                room.currentImage = '';
                room.isAutoSubmittedPrompt = false;
                room.promptStartTime = null;
                room.roundStartTime = null;
                room.gameState = 'waiting_for_prompt';

                console.log(`Starting new turn for player: ${room.currentPromptGiver}`);

                // Emit turn change
                const nextTurnData = {
                    round: room.currentRound,
                    maxRounds: room.maxRounds,
                    currentPromptGiver: room.currentPromptGiver,
                    players: Array.from(room.players.values()),
                    gameState: 'waiting_for_prompt',
                    currentTurnIndex: room.currentTurnIndex,
                    turnsCompletedInRound: room.turnsCompletedInRound,
                    totalPlayersInRound: room.playerOrder.length
                };

                io.to(roomId).emit('next_turn', nextTurnData);

                // Start prompt timer for new player
                room.startPromptTimer();
                room.promptTimer = setInterval(() => {
                    const remaining = room.getPromptTimeRemaining();
                    io.to(roomId).emit('prompt_timer_update', { timeRemaining: remaining });

                    if (remaining <= 0) {
                        room.clearPromptTimer();
                        // Auto-submit random prompt if needed
                        if (!room.currentPrompt) {
                            const randomPrompts = ['cat', 'sunset', 'robot', 'flower', 'mountain'];
                            const randomPrompt = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
                            room.isAutoSubmittedPrompt = true;
                            handlePromptSubmission(roomId, randomPrompt, true);
                        }
                    }
                }, 1000);

            } else if (room.gameState === 'guessing') {
                // If we were in guessing phase, end the round early and move to next turn
                console.log('Ending round early due to prompt giver leaving during guessing phase');
                endRound(roomId);
            }
        }

        console.log(`Turn management updated - currentTurnIndex: ${room.currentTurnIndex}, playerOrder length: ${room.playerOrder.length}`);
    }

    // Stock images for testing (using Unsplash for reliable, free images)
    const STOCK_IMAGES = [
        'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=512&h=512&fit=crop', // Cat
        'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=512&h=512&fit=crop', // Dog
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=512&h=512&fit=crop', // Sunset
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=512&h=512&fit=crop', // Mountain
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=512&h=512&fit=crop', // Forest
        'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=512&h=512&fit=crop', // Robot/Tech
        'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=512&h=512&fit=crop', // Flower
        'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=512&h=512&fit=crop', // City
        'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=512&h=512&fit=crop', // Breakfast
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=512&h=512&fit=crop'  // Beach
    ];

    // Improved similarity calculation with better semantic understanding
    function calculateSimilarity(originalPrompt, guess) {
        const normalize = (text) => text.toLowerCase().trim().replace(/[^\w\s]/g, '');
        const original = normalize(originalPrompt);
        const guessText = normalize(guess);

        // Exact match - perfect score
        if (original === guessText) return 100;

        const originalWords = original.split(/\s+/).filter(w => w.length > 0);
        const guessWords = guessText.split(/\s+/).filter(w => w.length > 0);

        // Calculate multiple similarity metrics
        const exactWordScore = calculateExactWordMatch(originalWords, guessWords);
        const partialWordScore = calculatePartialWordMatch(originalWords, guessWords);
        const orderScore = calculateWordOrderScore(originalWords, guessWords);
        const lengthPenalty = calculateLengthPenalty(original, guessText);
        const synonymScore = calculateSynonymScore(originalWords, guessWords);

        // Weighted combination of scores
        let finalScore = (
            exactWordScore * 0.4 +      // Exact word matches are most important
            partialWordScore * 0.25 +   // Partial matches help
            orderScore * 0.15 +         // Word order matters somewhat
            synonymScore * 0.2          // Synonyms are valuable
        ) * lengthPenalty;              // Apply length penalty

        return Math.round(Math.max(0, Math.min(100, finalScore)));
    }

    // Calculate exact word matches with position awareness
    function calculateExactWordMatch(originalWords, guessWords) {
        if (originalWords.length === 0) return 0;

        let matches = 0;
        const usedGuessIndices = new Set();

        originalWords.forEach((origWord, origIndex) => {
            guessWords.forEach((guessWord, guessIndex) => {
                if (!usedGuessIndices.has(guessIndex) && origWord === guessWord) {
                    matches++;
                    usedGuessIndices.add(guessIndex);
                    return; // Break inner loop
                }
            });
        });

        return (matches / originalWords.length) * 100;
    }

    // Calculate partial word matches (similar words, contains, etc.)
    function calculatePartialWordMatch(originalWords, guessWords) {
        if (originalWords.length === 0) return 0;

        let partialScore = 0;
        const usedGuessIndices = new Set();

        originalWords.forEach(origWord => {
            let bestMatch = 0;
            let bestIndex = -1;

            guessWords.forEach((guessWord, guessIndex) => {
                if (usedGuessIndices.has(guessIndex)) return;

                let score = 0;

                // Substring matches (but avoid short word bias)
                if (origWord.length >= 4 && guessWord.length >= 4) {
                    if (origWord.includes(guessWord) || guessWord.includes(origWord)) {
                        const minLen = Math.min(origWord.length, guessWord.length);
                        const maxLen = Math.max(origWord.length, guessWord.length);
                        score = (minLen / maxLen) * 70; // Max 70 for substring
                    }
                }

                // Levenshtein similarity for typos
                if (score < 50) {
                    const levScore = calculateLevenshteinSimilarity(origWord, guessWord);
                    if (levScore > 60) {
                        score = Math.max(score, levScore * 0.8); // Reduce Levenshtein impact
                    }
                }

                if (score > bestMatch) {
                    bestMatch = score;
                    bestIndex = guessIndex;
                }
            });

            if (bestIndex !== -1) {
                usedGuessIndices.add(bestIndex);
                partialScore += bestMatch;
            }
        });

        return partialScore / originalWords.length;
    }

    // Calculate word order similarity
    function calculateWordOrderScore(originalWords, guessWords) {
        if (originalWords.length <= 1 || guessWords.length <= 1) return 100;

        let orderScore = 0;
        let comparisons = 0;

        for (let i = 0; i < originalWords.length - 1; i++) {
            const word1 = originalWords[i];
            const word2 = originalWords[i + 1];

            const pos1 = guessWords.indexOf(word1);
            const pos2 = guessWords.indexOf(word2);

            if (pos1 !== -1 && pos2 !== -1) {
                comparisons++;
                if (pos1 < pos2) orderScore++; // Correct order
            }
        }

        return comparisons > 0 ? (orderScore / comparisons) * 100 : 50;
    }

    // Apply penalty for very different lengths
    function calculateLengthPenalty(original, guess) {
        const origLen = original.length;
        const guessLen = guess.length;

        if (origLen === 0 || guessLen === 0) return 0;

        const ratio = Math.min(origLen, guessLen) / Math.max(origLen, guessLen);

        // Gentle penalty for length differences
        if (ratio < 0.3) return 0.7;  // Very different lengths
        if (ratio < 0.5) return 0.85; // Somewhat different
        return 1.0; // Similar lengths
    }

    // Basic synonym detection (can be expanded)
    function calculateSynonymScore(originalWords, guessWords) {
        const synonyms = {
            'car': ['automobile', 'vehicle', 'auto'],
            'dog': ['puppy', 'canine', 'hound'],
            'cat': ['kitten', 'feline'],
            'house': ['home', 'building', 'residence'],
            'big': ['large', 'huge', 'giant', 'massive'],
            'small': ['tiny', 'little', 'mini'],
            'happy': ['joyful', 'cheerful', 'glad'],
            'sad': ['unhappy', 'depressed', 'gloomy'],
            'fast': ['quick', 'rapid', 'speedy'],
            'slow': ['sluggish', 'gradual'],
            'beautiful': ['pretty', 'gorgeous', 'lovely'],
            'ugly': ['hideous', 'unattractive'],
            'red': ['crimson', 'scarlet'],
            'blue': ['azure', 'navy'],
            'green': ['emerald', 'lime'],
            'old': ['ancient', 'elderly', 'aged'],
            'new': ['fresh', 'modern', 'recent']
        };

        let synonymMatches = 0;
        const usedGuessIndices = new Set();

        originalWords.forEach(origWord => {
            const origSynonyms = synonyms[origWord] || [];

            guessWords.forEach((guessWord, guessIndex) => {
                if (usedGuessIndices.has(guessIndex)) return;

                // Check if guess word is a synonym of original word
                if (origSynonyms.includes(guessWord)) {
                    synonymMatches++;
                    usedGuessIndices.add(guessIndex);
                    return;
                }

                // Check reverse (original word is synonym of guess word)
                const guessSynonyms = synonyms[guessWord] || [];
                if (guessSynonyms.includes(origWord)) {
                    synonymMatches++;
                    usedGuessIndices.add(guessIndex);
                }
            });
        });

        return originalWords.length > 0 ? (synonymMatches / originalWords.length) * 100 : 0;
    }

    // Helper function for Levenshtein distance
    function calculateLevenshteinSimilarity(s1, s2) {
        const maxLen = Math.max(s1.length, s2.length);
        if (maxLen === 0) return 100;

        const distance = levenshteinDistance(s1, s2);
        return Math.max(0, Math.round(((maxLen - distance) / maxLen) * 100));
    }

    function levenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    // Function to end a round and calculate scores
    function endRound(roomId) {
        const room = rooms.get(roomId);
        if (!room) return;

        console.log('Ending round for room:', roomId);

        // Clear any active timers
        room.clearAllTimers();

        // Calculate scores for all guesses
        const guessesWithScores = [];
        for (const [guessId, guess] of room.guesses) {
            const similarity = calculateSimilarity(room.currentPrompt, guess.guess);
            guessesWithScores.push({
                ...guess,
                score: similarity
            });
        }

        // Sort by score (highest first)
        guessesWithScores.sort((a, b) => b.score - a.score);

        // Award points to players with improved scoring system
        const playerBestGuesses = new Map(); // Track best guess per player

        // Find each player's best guess
        guessesWithScores.forEach(guess => {
            const currentBest = playerBestGuesses.get(guess.playerId);
            if (!currentBest || guess.score > currentBest.score) {
                playerBestGuesses.set(guess.playerId, guess);
            }
        });

        // Improved point awarding system
        playerBestGuesses.forEach((bestGuess, playerId) => {
            const player = room.players.get(playerId);
            if (player && bestGuess.score >= 10) { // Even lower threshold for points
                let points = calculateGamePoints(bestGuess.score);

                // Speed bonus: Earlier good guesses get bonus points (more generous)
                const guessIndex = guessesWithScores.findIndex(g => g === bestGuess);
                if (guessIndex < 3 && bestGuess.score >= 40) { // Lower threshold for speed bonus
                    // Top 3 guesses with decent similarity get speed bonus
                    const speedBonus = guessIndex === 0 ? 10 : guessIndex === 1 ? 7 : 4; // Increased bonuses
                    points += speedBonus;
                }

                // Accuracy bonus for high scores (more generous thresholds and bonuses)
                if (bestGuess.score >= 85) {
                    points += 15; // Perfect/near-perfect bonus (increased)
                } else if (bestGuess.score >= 75) {
                    points += 12;  // Excellent bonus (increased)
                } else if (bestGuess.score >= 65) {
                    points += 8;  // Very good bonus (increased)
                } else if (bestGuess.score >= 50) {
                    points += 5;  // Good bonus (increased)
                } else if (bestGuess.score >= 35) {
                    points += 3;  // Decent bonus (new tier)
                }

                // Effort bonus for any reasonable attempt (more generous)
                if (bestGuess.score >= 20) {
                    points += 3; // Increased bonus for trying
                } else if (bestGuess.score >= 10) {
                    points += 1; // Small bonus for any attempt
                }

                player.score += points;
                console.log(`${player.name} scored ${points} points (similarity: ${bestGuess.score}%)`);
            }
        });

        // Award points to the prompt giver based on difficulty
        const promptGiver = room.players.get(room.currentPromptGiver);
        if (promptGiver) {
            let promptGiverPoints = 0;
            if (room.isAutoSubmittedPrompt) {
                // No points for auto-submitted prompts (player didn't participate)
                console.log(`${promptGiver.name} (prompt giver) scored 0 points - prompt was auto-submitted due to timeout`);
            } else {
                promptGiverPoints = calculatePromptGiverScore(playerBestGuesses, room.players.size);
                console.log(`${promptGiver.name} (prompt giver) scored ${promptGiverPoints} points for prompt difficulty`);
            }
            promptGiver.score += promptGiverPoints;
        }

        // Convert similarity percentage to game points with fairer scaling
        function calculateGamePoints(similarity) {
            // Very generous point conversion - favor guessers
            if (similarity >= 80) return Math.round(similarity + 8);       // 88-108 pts (big bonus for great guesses)
            if (similarity >= 65) return Math.round(similarity + 3);       // 68-83 pts (bonus for good guesses)
            if (similarity >= 50) return Math.round(similarity);           // 50-64 pts (full value)
            if (similarity >= 35) return Math.round(similarity * 0.9);     // 32-49 pts (slight reduction)
            if (similarity >= 20) return Math.round(similarity * 0.8);     // 16-34 pts (generous)
            if (similarity >= 10) return Math.round(similarity * 0.7);     // 7-19 pts (lower threshold)
            return 0;
        }

        // Calculate prompt giver score based on difficulty balance (inverse scoring)
        function calculatePromptGiverScore(playerBestGuesses, totalPlayers) {
            const guessers = totalPlayers - 1; // Exclude the prompt giver
            if (guessers === 0) return 0;

            // Analyze the quality of guesses
            const guessScores = Array.from(playerBestGuesses.values()).map(guess => guess.score);
            const averageScore = guessScores.length > 0 ? guessScores.reduce((sum, score) => sum + score, 0) / guessScores.length : 0;

            // Count players by score tiers
            const excellentGuesses = guessScores.filter(score => score >= 80).length;
            const goodGuesses = guessScores.filter(score => score >= 50).length;
            const decentGuesses = guessScores.filter(score => score >= 25).length;
            const anyGuesses = guessScores.filter(score => score >= 10).length;

            const excellentRate = excellentGuesses / guessers;
            const goodRate = goodGuesses / guessers;
            const participationRate = anyGuesses / guessers;

            let promptGiverPoints = 0;

            // Base participation points - but only if people actually made decent attempts
            if (participationRate >= 0.8 && decentGuesses > 0) {
                promptGiverPoints += 15; // Good engagement with meaningful guesses
            } else if (participationRate >= 0.6 && decentGuesses > 0) {
                promptGiverPoints += 12; // Decent engagement with some meaningful guesses
            } else if (participationRate >= 0.4 && anyGuesses > 0) {
                promptGiverPoints += 8; // Some engagement
            } else if (participationRate >= 0.2) {
                promptGiverPoints += 3; // Poor engagement
            } else {
                promptGiverPoints += 0; // No engagement - bad prompt
            }

            // Difficulty scoring - INVERSE logic (harder prompts = more points)
            if (excellentRate === 0 && goodRate === 0 && decentGuesses > 0) {
                // No excellent/good guesses, but some decent ones - perfect difficulty!
                promptGiverPoints += 35;
            } else if (excellentRate === 0 && goodRate > 0 && goodRate <= 0.4) {
                // No excellent, few good guesses - great difficulty
                promptGiverPoints += 30;
            } else if (excellentRate === 0 && goodRate <= 0.6) {
                // No excellent, moderate good guesses - good difficulty
                promptGiverPoints += 25;
            } else if (excellentRate <= 0.2 && goodRate <= 0.5) {
                // Few excellent, some good - decent difficulty
                promptGiverPoints += 20;
            } else if (excellentRate <= 0.4) {
                // Some excellent guesses - getting easier
                promptGiverPoints += 15;
            } else if (excellentRate <= 0.6) {
                // Many excellent guesses - too easy
                promptGiverPoints += 10;
            } else {
                // Most guesses excellent - way too easy
                promptGiverPoints += 5;
            }

            // Average score penalty/bonus - sweet spot is 30-50 average
            if (averageScore >= 20 && averageScore <= 40) {
                promptGiverPoints += 8; // Perfect difficulty range
            } else if (averageScore >= 15 && averageScore <= 50) {
                promptGiverPoints += 5; // Good difficulty range
            } else if (averageScore >= 10 && averageScore <= 60) {
                promptGiverPoints += 2; // Acceptable range
            } else if (averageScore < 5) {
                // Gibberish/nonsense - people couldn't guess anything at all
                promptGiverPoints -= 15; // Heavy penalty for bad prompts
            } else if (averageScore < 10) {
                // Too hard - people couldn't guess anything meaningful
                promptGiverPoints -= 8;
            } else if (averageScore > 70) {
                // Too easy - people guessed too well
                promptGiverPoints -= 8;
            }

            // Bonus for creating engaging but challenging prompts
            if (participationRate >= 0.8 && averageScore >= 20 && averageScore <= 45) {
                promptGiverPoints += 5; // Engagement + perfect difficulty bonus
            }

            // Ensure minimum points only if there was some meaningful engagement
            if (decentGuesses === 0 && averageScore < 5) {
                // Complete failure - gibberish prompt gets 0 points
                promptGiverPoints = 0;
            } else {
                // Ensure some minimum points for any reasonable attempt
                promptGiverPoints = Math.max(promptGiverPoints, 3);
            }

            // Cap the maximum points (should be competitive with good guessers but not overpowered)
            return Math.min(promptGiverPoints, 60);
        }

        // Calculate variance in guess scores to reward creative prompts
        function calculateScoreVariance(scores) {
            if (scores.length === 0) return 0;

            const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;

            return variance;
        }

        // Send round results
        room.gameState = 'round_results';
        const promptGiverBonus = promptGiver ? calculatePromptGiverScore(playerBestGuesses, room.players.size) : 0;
        const roundEndedData = {
            originalPrompt: room.currentPrompt,
            isAutoSubmitted: room.isAutoSubmittedPrompt,
            guesses: guessesWithScores || [], // Ensure it's always an array
            players: Array.from(room.players.values()),
            round: room.currentRound,
            promptGiver: room.currentPromptGiver,
            promptGiverBonus: promptGiverBonus
        };

        // Store round results for reconnecting players
        room.lastRoundResults = roundEndedData;

        console.log('Sending round_ended data:', roundEndedData);
        io.to(roomId).emit('round_ended', roundEndedData);

        // Move to next turn after 8 seconds (longer to review scores)
        setTimeout(() => {
            // Check if this was the last turn of the last round
            const isLastTurnOfLastRound = room.currentRound === room.maxRounds &&
                (room.turnsCompletedInRound + 1) >= room.playerOrder.length;

            console.log('Game completion check BEFORE nextTurn:', {
                currentRound: room.currentRound,
                maxRounds: room.maxRounds,
                turnsCompletedInRound: room.turnsCompletedInRound,
                playerOrderLength: room.playerOrder.length,
                isLastTurnOfLastRound
            });

            if (isLastTurnOfLastRound) {
                // Game over - we just finished the last turn of the last round
                console.log('Game complete! All rounds and turns finished.');
                endGame(roomId);
            } else {
                // Next turn - rotate to next player
                room.nextTurn();

                const nextTurnData = {
                    round: room.currentRound,
                    maxRounds: room.maxRounds,
                    currentPromptGiver: room.currentPromptGiver,
                    players: Array.from(room.players.values()),
                    gameState: 'waiting_for_prompt',
                    currentTurnIndex: room.currentTurnIndex,
                    turnsCompletedInRound: room.turnsCompletedInRound,
                    totalPlayersInRound: room.playerOrder.length
                };

                console.log('Emitting next_turn:', nextTurnData);
                io.to(roomId).emit('next_turn', nextTurnData);

                // Start prompt timer for new round
                room.startPromptTimer();
                room.promptTimer = setInterval(() => {
                    const remaining = room.getPromptTimeRemaining();
                    io.to(roomId).emit('prompt_timer_update', { timeRemaining: remaining });

                    if (remaining <= 0) {
                        room.clearPromptTimer();
                        // Auto-submit random prompt if needed
                        if (!room.currentPrompt) {
                            const randomPrompts = ['cat', 'sunset', 'robot', 'flower', 'mountain'];
                            const randomPrompt = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
                            room.isAutoSubmittedPrompt = true; // Mark as auto-submitted
                            handlePromptSubmission(roomId, randomPrompt, true); // Use random image
                        }
                    }
                }, 1000);
            }
        }, 8000);
    }

    // Nonsense words are now handled naturally by the AI - it will render them as text,
    // making them easy to guess and giving the prompt giver minimal points

    // Function to end the game
    function endGame(roomId) {
        const room = rooms.get(roomId);
        if (!room) return;

        console.log('Ending game for room:', roomId);

        // Clear any active timers
        room.clearAllTimers();

        room.gameState = 'finished';

        // Calculate final rankings
        const finalPlayers = Array.from(room.players.values())
            .sort((a, b) => b.score - a.score);

        console.log('Emitting game_finished event to room:', roomId);
        io.to(roomId).emit('game_finished', {
            players: finalPlayers,
            winner: finalPlayers[0]
        });
        console.log('Game finished event emitted with data:', {
            players: finalPlayers.map(p => ({ name: p.name, score: p.score })),
            winner: finalPlayers[0] ? { name: finalPlayers[0].name, score: finalPlayers[0].score } : null
        });
    }

    // Function to handle prompt submission (used by both manual and auto-submit)
    async function handlePromptSubmission(roomId, prompt, useRandomImage = false) {
        const room = rooms.get(roomId);
        if (!room) return;

        try {
            console.log('Starting image generation for prompt:', prompt, 'useRandomImage:', useRandomImage);

            // Clear the prompt timer since a prompt was submitted
            room.clearPromptTimer();

            room.currentPrompt = prompt;

            let imageUrl;
            if (useRandomImage) {
                // Use a random stock image for testing
                imageUrl = STOCK_IMAGES[Math.floor(Math.random() * STOCK_IMAGES.length)];
                console.log('Using random stock image:', imageUrl);
            } else {
                // Use AI service
                imageUrl = await aiService.generateImage(prompt);
                console.log('Image generated via AI:', imageUrl);
                costTracker.trackImageGeneration(aiService.provider);
            }

            room.currentImage = imageUrl;
            room.startRoundTimer();

            io.to(roomId).emit('prompt_submitted', {
                imageUrl,
                timeRemaining: GAME_CONFIG.ROUND_TIME
            });

            // Start guessing countdown timer
            room.roundTimer = setInterval(() => {
                const remaining = room.getRemainingTime();
                io.to(roomId).emit('timer_update', { timeRemaining: remaining });

                if (remaining <= 0) {
                    room.clearRoundTimer();
                    endRound(roomId);
                }
            }, 1000);

        } catch (error) {
            console.error('Error generating image:', error);
            io.to(roomId).emit('error', { message: 'Failed to generate image. Please try again.' });
        }
    }

    socket.on('set_max_rounds', ({ roomId, maxRounds }) => {
        console.log('Received set_max_rounds:', { roomId, maxRounds });
        const room = rooms.get(roomId);

        if (room && room.gameState === 'waiting') {
            // Only allow room creator to change max rounds
            if (room.isRoomCreator(socket.id)) {
                console.log(`Before setMaxRounds: room.maxRounds = ${room.maxRounds}`);
                room.setMaxRounds(maxRounds);
                console.log(`After setMaxRounds: room.maxRounds = ${room.maxRounds}`);

                // Notify all players about the change
                const roomUpdateData = {
                    players: Array.from(room.players.values()),
                    spectators: Array.from(room.spectators.values()),
                    gameState: room.gameState,
                    currentRound: room.currentRound,
                    maxRounds: room.maxRounds,
                    currentPromptGiver: room.currentPromptGiver,
                    allReady: Array.from(room.players.values()).length >= 2 &&
                        Array.from(room.players.values()).every(p => p.isReady)
                };
                console.log(`Emitting room_update with maxRounds: ${roomUpdateData.maxRounds}`);
                io.to(roomId).emit('room_update', roomUpdateData);
            } else {
                socket.emit('error', { message: 'Only the room creator can change the number of rounds.' });
            }
        }
    });

    socket.on('submit_prompt', async ({ roomId, prompt, useRandomImage = false }) => {
        console.log('Received submit_prompt:', { roomId, prompt, useRandomImage });
        const room = rooms.get(roomId);

        if (room && room.gameState === 'waiting_for_prompt' && room.currentPromptGiver === socket.id) {
            // Basic validation only (skip validation for random images)
            if (!useRandomImage) {
                const trimmedPrompt = prompt.trim();
                if (trimmedPrompt.length === 0) {
                    socket.emit('error', { message: 'Prompt cannot be empty!' });
                    return;
                }
                if (trimmedPrompt.length > GAME_CONFIG.MAX_PROMPT_CHARS) {
                    socket.emit('error', { message: `Prompt must be ${GAME_CONFIG.MAX_PROMPT_CHARS} characters or less!` });
                    return;
                }
                const words = trimmedPrompt.split(/\s+/).filter(word => word.length > 0);
                if (words.length > 5) {
                    socket.emit('error', { message: 'Prompt must be 5 words or less!' });
                    return;
                }
            }

            const finalPrompt = prompt.trim() || 'random image';
            await handlePromptSubmission(roomId, finalPrompt, useRandomImage);
        } else {
            console.log('Invalid prompt submission - wrong player or game state');
        }
    });

    socket.on('submit_guess', ({ roomId, guess, playerName }) => {
        const room = rooms.get(roomId);
        if (room && room.gameState === 'guessing') {
            const player = room.players.get(socket.id);
            if (player && !player.isPromptGiver) {
                // Allow multiple guesses per player
                const guessId = `${socket.id}_${Date.now()}`;
                room.guesses.set(guessId, {
                    playerName: player.name,
                    guess,
                    playerId: socket.id,
                    timestamp: Date.now()
                });

                // Emit to all players in real-time
                const guessData = {
                    playerName: player.name,
                    guess,
                    timestamp: Date.now()
                };

                console.log(`Broadcasting guess to room ${roomId}:`, guessData);
                io.to(roomId).emit('guess_submitted', guessData);

                console.log(`Guess submitted: ${player.name} -> "${guess}"`);
            }
        }
    });



    socket.on('disconnect', () => {
        console.log(`Socket ${socket.id} disconnected`);

        // Remove players immediately when they disconnect
        rooms.forEach((room, roomId) => {
            let wasPlayer = false;
            let wasSpectator = false;
            let playerName = null;
            let spectatorName = null;

            if (room.players.has(socket.id)) {
                const player = room.players.get(socket.id);
                playerName = player.name;
                room.removePlayer(socket.id);
                wasPlayer = true;
                console.log(`Player ${playerName} removed from room ${roomId}`);
            }

            if (room.spectators.has(socket.id)) {
                const spectator = room.spectators.get(socket.id);
                spectatorName = spectator.name;
                room.removeSpectator(socket.id);
                wasSpectator = true;
                console.log(`Spectator ${spectatorName} removed from room ${roomId}`);
            }

            if (wasPlayer || wasSpectator) {
                // Check if room is now empty
                if (room.players.size === 0 && room.spectators.size === 0) {
                    console.log(`Deleting empty room ${roomId}`);
                    room.clearAllTimers(); // Clear any active timers before deleting
                    rooms.delete(roomId);
                } else if (wasPlayer) {
                    // Handle player leaving during active game
                    const wasCurrentPromptGiver = room.currentPromptGiver === socket.id;

                    // Update player order and turn management
                    if (room.gameState !== 'waiting' && room.gameState !== 'finished') {
                        handlePlayerLeaving(room, socket.id, wasCurrentPromptGiver, roomId);
                    } else if (room.gameState === 'waiting') {
                        // If in waiting phase, just update the prompt giver if needed
                        if (wasCurrentPromptGiver && room.players.size > 0) {
                            // Set first remaining player as prompt giver
                            const firstPlayer = Array.from(room.players.keys())[0];
                            room.currentPromptGiver = firstPlayer;
                            room.players.get(firstPlayer).isPromptGiver = true;
                        }
                    }

                    // Notify remaining players about the disconnection
                    io.to(roomId).emit('room_update', {
                        players: Array.from(room.players.values()),
                        spectators: Array.from(room.spectators.values()),
                        gameState: room.gameState,
                        currentRound: room.currentRound,
                        maxRounds: room.maxRounds,
                        currentPromptGiver: room.currentPromptGiver
                    });

                    io.to(roomId).emit('player_left', {
                        playerName: playerName,
                        message: `${playerName} has left the game. The game will continue with remaining players.`
                    });
                } else if (wasSpectator) {
                    // Just notify about spectator leaving
                    io.to(roomId).emit('room_update', {
                        players: Array.from(room.players.values()),
                        spectators: Array.from(room.spectators.values()),
                        gameState: room.gameState,
                        currentRound: room.currentRound,
                        maxRounds: room.maxRounds,
                        currentPromptGiver: room.currentPromptGiver
                    });
                }

                // Immediately notify other players about disconnection status
                io.to(roomId).emit('room_update', {
                    players: Array.from(room.players.values()),
                    spectators: Array.from(room.spectators.values()),
                    gameState: room.gameState,
                    currentRound: room.currentRound,
                    maxRounds: room.maxRounds,
                    currentPromptGiver: room.currentPromptGiver
                });
            }
        });
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});