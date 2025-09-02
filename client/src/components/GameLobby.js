import React, { useState } from 'react';

function GameLobby({ onJoinRoom }) {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (playerName.trim() && roomId.trim()) {
      onJoinRoom(playerName.trim(), roomId.trim());
    }
  };

  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(id);
  };

  return (
    <div className="game-lobby">
      <div className="lobby-container">
        <h2>Join or Create a Game</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="playerName">Your Name:</label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              required
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="roomId">Room Code:</label>
            <div className="room-input-container">
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                maxLength={6}
                required
              />
              <button type="button" onClick={generateRoomId} className="generate-btn">
                Generate
              </button>
            </div>
          </div>
          
          <button type="submit" className="join-btn">
            Join Game
          </button>
        </form>
        
        <div className="game-rules">
          <h3>How to Play:</h3>
          <ul>
            <li>One player creates a prompt (max 5 words)</li>
            <li>AI generates an image from the prompt</li>
            <li>Other players guess the original prompt</li>
            <li>Points awarded based on similarity to original</li>
            <li>60 seconds per round</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default GameLobby;