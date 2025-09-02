import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import GameLobby from './components/GameLobby';
import GameRoom from './components/GameRoom';
import './App.css';

const socket = io('http://localhost:5000');

function App() {
  const [gameState, setGameState] = useState('lobby'); // lobby, room, playing
  const [roomId, setRoomId] = useState('');
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [allReady, setAllReady] = useState(false);
  const [gameData, setGameData] = useState(null);

  useEffect(() => {
    console.log('Setting up socket listeners in App.js');
    console.log('Socket connected:', socket.connected);
    console.log('Socket ID:', socket.id);
    
    // Clean up any existing listeners first
    socket.off('room_update');
    socket.off('game_started');

    socket.on('room_update', (data) => {
      console.log('Room update received:', data);
      setPlayers(data.players);
      setAllReady(data.allReady || false);
      
      // Update game data if we're playing and have currentPromptGiver info
      if (data.currentPromptGiver) {
        setGameData(prevGameData => prevGameData ? {
          ...prevGameData,
          currentPromptGiver: data.currentPromptGiver
        } : null);
      }
      
      // Only set to room state if we're not already playing
      setGameState(currentState => {
        console.log('Current state in room_update:', currentState);
        if (currentState !== 'playing') {
          console.log('Setting state to room');
          return 'room';
        }
        return currentState;
      });
    });

    socket.on('game_started', (data) => {
      console.log('🎮 GAME_STARTED EVENT RECEIVED IN APP.JS:', data);
      console.log('About to set game state to playing');
      setGameState('playing');
      setPlayers(data.players);
      setGameData({
        currentPromptGiver: data.currentPromptGiver,
        round: data.round,
        gameState: data.gameState || 'waiting_for_prompt',
        timeRemaining: 30,
        promptTimeRemaining: 30
      });
      console.log('✅ Set game state to playing');
    });

    // Add a test listener to see if ANY events are being received
    socket.onAny((eventName, ...args) => {
      console.log('📡 Received event:', eventName, args);
    });

    return () => {
      console.log('Cleaning up socket listeners in App.js');
      socket.off('room_update');
      socket.off('game_started');
      socket.offAny();
    };
  }, []); // Remove gameState dependency

  const joinRoom = (name, room) => {
    setRoomId(room);
    setCurrentPlayer({ id: socket.id, name });
    socket.emit('join_room', { roomId: room, playerName: name });
  };

  const toggleReady = () => {
    console.log('Toggle Ready clicked! Room ID:', roomId);
    console.log('Socket connected:', socket.connected);
    console.log('Socket ID:', socket.id);
    socket.emit('toggle_ready', { roomId });
    console.log('Emitted toggle_ready event');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Prompt Guesser</h1>
        {/* Debug info */}
        <div style={{fontSize: '12px', background: 'rgba(0,0,0,0.3)', padding: '5px'}}>
          App State: {gameState} | Players: {players.length} | Room: {roomId} | All Ready: {allReady ? 'YES' : 'NO'}
        </div>
      </header>
      
      {gameState === 'lobby' && (
        <GameLobby onJoinRoom={joinRoom} />
      )}
      
      {gameState === 'room' && (
        <GameRoom 
          players={players}
          currentPlayer={currentPlayer}
          roomId={roomId}
          onToggleReady={toggleReady}
          allReady={allReady}
          socket={socket}
        />
      )}
      
      {gameState === 'playing' && (
        <GameRoom 
          players={players}
          currentPlayer={currentPlayer}
          roomId={roomId}
          socket={socket}
          isPlaying={true}
          initialGameData={gameData}
        />
      )}
    </div>
  );
}

export default App;