require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
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
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

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
        this.currentRound = 0;
        this.maxRounds = 5;
        this.currentPromptGiver = null;
        this.currentPrompt = '';
        this.currentImage = '';
        this.guesses = new Map();
        this.roundStartTime = null;
        this.promptStartTime = null;
        this.gameState = 'waiting'; // waiting, waiting_for_prompt, guessing, round_results, finished
        this.playerOrder = []; // Array to track turn order
    }

    addPlayer(socketId, playerName) {
        this.players.set(socketId, {
            id: socketId,
            name: playerName,
            score: 0,
            isPromptGiver: false,
            isReady: false
        });
    }

    removePlayer(socketId) {
        this.players.delete(socketId);
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
        // Only increment if we're not starting the first round
        if (this.gameState !== 'waiting') {
            this.currentRound++;
        } else {
            // First round
            this.currentRound = 1;
        }
        
        this.guesses.clear();
        this.currentPrompt = '';
        this.currentImage = '';
        this.promptStartTime = null;
        this.roundStartTime = null;

        // Update player roles
        this.players.forEach((player, id) => {
            player.isPromptGiver = id === this.currentPromptGiver;
        });

        this.gameState = 'waiting_for_prompt';
    }

    nextRound() {
        this.currentRound++;
        this.currentPromptGiver = this.getNextPromptGiver();
        this.guesses.clear();
        this.currentPrompt = '';
        this.currentImage = '';
        this.promptStartTime = null;
        this.roundStartTime = null;

        // Update player roles
        this.players.forEach((player, id) => {
            player.isPromptGiver = id === this.currentPromptGiver;
        });

        this.gameState = 'waiting_for_prompt';
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
}

// Socket handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', ({ roomId, playerName }) => {
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new GameRoom(roomId));
        }

        const room = rooms.get(roomId);
        
        // Check room size limit
        if (room.players.size >= 5) {
            socket.emit('error', { message: 'Room is full! Maximum 5 players allowed.' });
            return;
        }

        // Check if player with same name already exists (reconnection)
        let existingPlayerId = null;
        for (const [playerId, player] of room.players) {
            if (player.name === playerName) {
                existingPlayerId = playerId;
                break;
            }
        }

        if (existingPlayerId && existingPlayerId !== socket.id) {
            // Player is reconnecting with new socket ID
            console.log(`Player ${playerName} reconnecting. Old ID: ${existingPlayerId}, New ID: ${socket.id}`);
            
            // Get the old player data
            const oldPlayerData = room.players.get(existingPlayerId);
            
            // Remove old player and add with new socket ID
            room.players.delete(existingPlayerId);
            room.addPlayer(socket.id, playerName);
            
            // Copy over the old player's data
            const newPlayer = room.players.get(socket.id);
            newPlayer.score = oldPlayerData.score;
            newPlayer.isReady = oldPlayerData.isReady;
            newPlayer.isPromptGiver = oldPlayerData.isPromptGiver;
            
            // Update currentPromptGiver if this was the prompt giver
            if (room.currentPromptGiver === existingPlayerId) {
                room.currentPromptGiver = socket.id;
                console.log(`Updated currentPromptGiver from ${existingPlayerId} to ${socket.id}`);
            }
            
            // Update playerOrder if it exists
            const orderIndex = room.playerOrder.indexOf(existingPlayerId);
            if (orderIndex !== -1) {
                room.playerOrder[orderIndex] = socket.id;
                console.log(`Updated playerOrder: ${room.playerOrder}`);
            }
        } else {
            // New player joining
            room.addPlayer(socket.id, playerName);
            
            // If first player, make them prompt giver
            if (room.players.size === 1) {
                room.currentPromptGiver = socket.id;
                room.players.get(socket.id).isPromptGiver = true;
            }
        }

        socket.join(roomId);

        const roomUpdateData = {
            players: Array.from(room.players.values()),
            gameState: room.gameState,
            currentRound: room.currentRound,
            maxRounds: room.maxRounds,
            currentPromptGiver: room.currentPromptGiver
        };
        
        console.log(`Emitting room_update for ${roomId}:`, roomUpdateData);
        io.to(roomId).emit('room_update', roomUpdateData);
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
                            gameState: room.gameState
                        };

                        console.log('Emitting game_started to room:', roomId);
                        console.log('Game started data:', gameStartedData);
                        console.log('Sockets in room:', io.sockets.adapter.rooms.get(roomId));
                        io.to(roomId).emit('game_started', gameStartedData);
                        console.log('game_started event emitted successfully');

                        // Start prompt timer
                        room.startPromptTimer();
                        const promptTimer = setInterval(() => {
                            const remaining = room.getPromptTimeRemaining();
                            io.to(roomId).emit('prompt_timer_update', { timeRemaining: remaining });

                            if (remaining <= 0) {
                                clearInterval(promptTimer);
                                // Auto-submit a random prompt if no prompt was submitted
                                if (!room.currentPrompt) {
                                    const randomPrompts = ['cat', 'sunset', 'robot', 'flower', 'mountain'];
                                    const randomPrompt = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
                                    room.currentPrompt = randomPrompt;
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

    // Function to calculate similarity score between two strings
    function calculateSimilarity(str1, str2) {
        const s1 = str1.toLowerCase().trim();
        const s2 = str2.toLowerCase().trim();
        
        // Exact match
        if (s1 === s2) return 100;
        
        // Check if one contains the other
        if (s1.includes(s2) || s2.includes(s1)) return 85;
        
        // Simple Levenshtein distance-based similarity
        const maxLen = Math.max(s1.length, s2.length);
        if (maxLen === 0) return 100;
        
        const distance = levenshteinDistance(s1, s2);
        const similarity = Math.max(0, Math.round(((maxLen - distance) / maxLen) * 100));
        
        return similarity;
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

        // Award points to players
        guessesWithScores.forEach((guess, index) => {
            const player = room.players.get(guess.playerId);
            if (player) {
                if (index === 0 && guess.score >= 80) {
                    // Best guess gets bonus points
                    player.score += guess.score;
                } else if (guess.score >= 50) {
                    // Good guesses get partial points
                    player.score += Math.floor(guess.score * 0.7);
                }
            }
        });

        // Send round results
        room.gameState = 'round_results';
        const roundEndedData = {
            originalPrompt: room.currentPrompt,
            guesses: guessesWithScores || [], // Ensure it's always an array
            players: Array.from(room.players.values()),
            round: room.currentRound
        };
        
        console.log('Sending round_ended data:', roundEndedData);
        io.to(roomId).emit('round_ended', roundEndedData);

        // Move to next round after 5 seconds
        setTimeout(() => {
            if (room.currentRound >= room.maxRounds) {
                // Game over
                endGame(roomId);
            } else {
                // Next round - rotate to next player
                room.nextRound();
                
                const nextRoundData = {
                    round: room.currentRound,
                    maxRounds: room.maxRounds,
                    currentPromptGiver: room.currentPromptGiver,
                    players: Array.from(room.players.values()),
                    gameState: 'waiting_for_prompt'
                };
                
                console.log('Emitting next_round:', nextRoundData);
                io.to(roomId).emit('next_round', nextRoundData);

                // Start prompt timer for new round
                room.startPromptTimer();
                const promptTimer = setInterval(() => {
                    const remaining = room.getPromptTimeRemaining();
                    io.to(roomId).emit('prompt_timer_update', { timeRemaining: remaining });

                    if (remaining <= 0) {
                        clearInterval(promptTimer);
                        // Auto-submit random prompt if needed
                        if (!room.currentPrompt) {
                            const randomPrompts = ['cat', 'sunset', 'robot', 'flower', 'mountain'];
                            const randomPrompt = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
                            handlePromptSubmission(roomId, randomPrompt, true); // Use random image
                        }
                    }
                }, 1000);
            }
        }, 5000);
    }

    // Function to end the game
    function endGame(roomId) {
        const room = rooms.get(roomId);
        if (!room) return;

        console.log('Ending game for room:', roomId);
        room.gameState = 'finished';

        // Calculate final rankings
        const finalPlayers = Array.from(room.players.values())
            .sort((a, b) => b.score - a.score);

        io.to(roomId).emit('game_ended', {
            players: finalPlayers,
            winner: finalPlayers[0]
        });
    }

    // Function to handle prompt submission (used by both manual and auto-submit)
    async function handlePromptSubmission(roomId, prompt, useRandomImage = false) {
        const room = rooms.get(roomId);
        if (!room) return;

        try {
            console.log('Starting image generation for prompt:', prompt, 'useRandomImage:', useRandomImage);
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
            const timer = setInterval(() => {
                const remaining = room.getRemainingTime();
                io.to(roomId).emit('timer_update', { timeRemaining: remaining });

                if (remaining <= 0) {
                    clearInterval(timer);
                    endRound(roomId);
                }
            }, 1000);

        } catch (error) {
            console.error('Error generating image:', error);
            io.to(roomId).emit('error', { message: 'Failed to generate image. Please try again.' });
        }
    }

    socket.on('submit_prompt', async ({ roomId, prompt, useRandomImage = false }) => {
        console.log('Received submit_prompt:', { roomId, prompt, useRandomImage });
        const room = rooms.get(roomId);
        
        if (room && room.gameState === 'waiting_for_prompt' && room.currentPromptGiver === socket.id) {
            // Validate prompt length (skip validation for random images)
            if (!useRandomImage && prompt.length > GAME_CONFIG.MAX_PROMPT_CHARS) {
                socket.emit('error', { message: `Prompt must be ${GAME_CONFIG.MAX_PROMPT_CHARS} characters or less!` });
                return;
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
        // Remove player from all rooms
        rooms.forEach((room, roomId) => {
            if (room.players.has(socket.id)) {
                room.removePlayer(socket.id);
                if (room.players.size === 0) {
                    rooms.delete(roomId);
                } else {
                    io.to(roomId).emit('room_update', {
                        players: Array.from(room.players.values()),
                        gameState: room.gameState
                    });
                }
            }
        });
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});