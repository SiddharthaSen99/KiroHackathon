import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import GameLobby from './components/GameLobby';
import GameRoom from './components/GameRoom';
import RoomCreated from './components/RoomCreated';
import soundManager from './utils/soundManager';
import './App.css';

const socket = io(process.env.NODE_ENV === 'production' ? 'https://kirohackathon-production.up.railway.app' : 'http://localhost:5000');

function App() {
  const [gameState, setGameState] = useState('lobby'); // lobby, room_created, room, playing
  const [roomId, setRoomId] = useState('');
  const [players, setPlayers] = useState([]);
  const [spectators, setSpectators] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [allReady, setAllReady] = useState(false);
  const [gameData, setGameData] = useState(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const [maxRounds, setMaxRounds] = useState(5);
  const [lobbyError, setLobbyError] = useState('');

  useEffect(() => {
    // Clean up any existing listeners first
    socket.off('room_created');
    socket.off('room_update');
    socket.off('game_started');
    socket.off('spectator_joined');
    socket.off('room_not_found');
    socket.off('room_error');
    socket.off('game_in_progress');
    socket.off('name_taken');
    socket.off('player_left');

    socket.on('room_created', (data) => {
      soundManager.playRoomCreated();
      setLobbyError(''); // Clear any previous errors
      setPlayers(data.players);
      setSpectators(data.spectators || []);
      setGameState('room_created');
    });

    socket.on('room_not_found', (data) => {
      console.log('Room not found error received:', data);
      setLobbyError(data.message || 'Room not found. Please check the room code and try again.');
    });

    socket.on('room_error', (data) => {
      console.log('Room error received:', data);
      setLobbyError(data.message || 'An error occurred while joining the room.');
    });

    socket.on('game_in_progress', (data) => {
      console.log('Game in progress error received:', data);
      setLobbyError(data.message || 'This game is already in progress. You cannot join once a game has started.');
    });

    socket.on('name_taken', (data) => {
      console.log('Name taken error received:', data);
      setLobbyError(data.message || 'This name is already taken in the room. Please choose a different name.');
    });

    socket.on('player_left', (data) => {
      console.log('Player left:', data);
      // You could show a toast notification here if desired
      // For now, the room_update will handle the UI changes
    });

    socket.on('room_update', (data) => {
      console.log('App.js: Received room_update:', data);
      const prevPlayers = players;
      const prevAllReady = allReady;
      
      setLobbyError(''); // Clear errors on successful room update
      setPlayers(data.players);
      setSpectators(data.spectators || []);
      setAllReady(data.allReady || false);
      
      // Update maxRounds if provided
      if (data.maxRounds !== undefined) {
        console.log('App.js: Updating maxRounds from', maxRounds, 'to', data.maxRounds);
        setMaxRounds(data.maxRounds);
      }
      
      // Play sound effects for player changes
      if (prevPlayers.length < data.players.length) {
        soundManager.playPlayerJoin();
      }
      
      // Play sound when someone becomes ready (but not when they become unready)
      const prevReadyCount = prevPlayers.filter(p => p.isReady).length;
      const newReadyCount = data.players.filter(p => p.isReady).length;
      if (newReadyCount > prevReadyCount) {
        soundManager.playPlayerReady();
      }
      
      // Play special sound when all players are ready
      if (!prevAllReady && data.allReady) {
        soundManager.playAllReady();
      }
      
      // Update game data if we're playing and have currentPromptGiver info
      if (data.currentPromptGiver) {
        setGameData(prevGameData => prevGameData ? {
          ...prevGameData,
          currentPromptGiver: data.currentPromptGiver
        } : null);
      }
      
      // Only set to room state if we're not already playing
      setGameState(currentState => {
        if (currentState !== 'playing') {
          return 'room';
        }
        return currentState;
      });
    });

    socket.on('spectator_joined', (data) => {
      soundManager.playPlayerJoin(); // Play join sound for spectators too
      setLobbyError(''); // Clear errors on successful spectator join
      setPlayers(data.players);
      setSpectators(data.spectators || []);
      setIsSpectator(true);
      
      // If game is in progress, set up game data for spectator
      if (data.gameState !== 'waiting') {
        setGameState('playing');
        setGameData({
          currentPromptGiver: data.currentPromptGiver,
          round: data.currentRound,
          gameState: data.gameState,
          currentImage: data.currentImage,
          currentPrompt: data.currentPrompt,
          timeRemaining: 30,
          promptTimeRemaining: 30
        });
      } else {
        setGameState('room');
      }
    });

    socket.on('game_started', (data) => {
      setGameState('playing');
      setPlayers(data.players);
      setGameData({
        currentPromptGiver: data.currentPromptGiver,
        round: data.round,
        gameState: data.gameState || 'waiting_for_prompt',
        timeRemaining: 30,
        promptTimeRemaining: 30,
        currentTurnIndex: data.currentTurnIndex,
        turnsCompletedInRound: data.turnsCompletedInRound,
        totalPlayersInRound: data.totalPlayersInRound
      });
    });

    return () => {
      socket.off('room_created');
      socket.off('room_not_found');
      socket.off('room_error');
      socket.off('room_update');
      socket.off('game_started');
      socket.off('spectator_joined');
    };
  }, []); // Remove gameState dependency

  const joinRoom = (name, room) => {
    setRoomId(room);
    setCurrentPlayer({ id: socket.id, name });
    setIsSpectator(false);
    socket.emit('join_room', { roomId: room, playerName: name });
  };

  const joinAsSpectator = (name, room) => {
    setRoomId(room);
    setCurrentPlayer({ id: socket.id, name });
    setIsSpectator(true);
    socket.emit('join_room_as_spectator', { roomId: room, spectatorName: name });
  };

  const createRoom = (name, room) => {
    setRoomId(room);
    setCurrentPlayer({ id: socket.id, name });
    setIsSpectator(false);
    socket.emit('create_room', { roomId: room, playerName: name });
  };

  const toggleReady = () => {
    socket.emit('toggle_ready', { roomId });
  };

  const continueToRoom = () => {
    setGameState('room');
  };

  const clearLobbyError = () => {
    setLobbyError('');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Prompt Guesser</h1>
      </header>
      
      {gameState === 'lobby' && (
        <GameLobby 
          onJoinRoom={joinRoom} 
          onJoinAsSpectator={joinAsSpectator} 
          onCreateRoom={createRoom}
          error={lobbyError}
          onClearError={clearLobbyError}
        />
      )}
      
      {gameState === 'room_created' && (
        <RoomCreated 
          roomId={roomId}
          players={players}
          onContinue={continueToRoom}
        />
      )}
      
      {gameState === 'room' && (
        <GameRoom 
          players={players}
          spectators={spectators}
          currentPlayer={currentPlayer}
          roomId={roomId}
          onToggleReady={toggleReady}
          allReady={allReady}
          socket={socket}
          isSpectator={isSpectator}
          maxRoundsFromParent={maxRounds}
        />
      )}
      
      {gameState === 'playing' && (
        <GameRoom 
          players={players}
          spectators={spectators}
          currentPlayer={currentPlayer}
          roomId={roomId}
          socket={socket}
          isPlaying={true}
          initialGameData={gameData}
          onUpdatePlayers={setPlayers}
          isSpectator={isSpectator}
          maxRoundsFromParent={maxRounds}
        />
      )}
      
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-support">
            <a 
              href="https://buymeacoffee.com/sidsen" 
              target="_blank" 
              rel="noopener noreferrer"
              className="coffee-link"
            >
              ☕ Buy me a coffee
            </a>
          </div>
          <div className="footer-credits">
            <p>© 2024 Impromptu. All rights reserved.</p>
            <p>
              Designed and developed by{' '}
              <a 
                href="https://x.com/SidTheBuilder" 
                target="_blank" 
                rel="noopener noreferrer"
                className="developer-link"
              >
                SidSen
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;