import React, { useState } from 'react';

function GameLobby({ onJoinRoom, onJoinAsSpectator, onCreateRoom, error: externalError, onClearError }) {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [activeTab, setActiveTab] = useState('join'); // 'join' or 'create'
  const [error, setError] = useState('');

  // Use external error if provided, otherwise use internal error
  const displayError = externalError || error;

  // Clear errors when switching tabs or typing
  const clearErrors = () => {
    setError('');
    if (onClearError) onClearError();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    clearErrors();
    if (playerName.trim() && roomId.trim()) {
      onJoinRoom(playerName.trim(), roomId.trim());
    }
  };

  const handleSpectatorJoin = (e) => {
    e.preventDefault();
    clearErrors();
    if (playerName.trim() && roomId.trim()) {
      onJoinAsSpectator(playerName.trim(), roomId.trim());
    }
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    clearErrors();
    if (playerName.trim()) {
      const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      onCreateRoom(playerName.trim(), newRoomId);
    }
  };

  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(id);
  };

  return (
    <div className="game-lobby">
      <div className="lobby-container">
        <div className="game-title">
          <h1 className="title-main">Impromptu</h1>
          <p className="title-subtitle">the ai prompt guesser game</p>
        </div>

        <div className="lobby-tabs">
          <button
            className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => { setActiveTab('create'); clearErrors(); }}
          >
            🎮 Create Room
          </button>
          <button
            className={`tab-btn ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => { setActiveTab('join'); clearErrors(); }}
          >
            🚪 Join Room
          </button>
        </div>

        {activeTab === 'create' && (
          <div className="tab-content">
            <div className="tab-header">
              <h3>Create a New Game Room</h3>
              <p>Start your own game and invite friends!</p>
            </div>

            <form onSubmit={handleCreateRoom}>
              <div className="input-group">
                <label htmlFor="creatorName">Your Name:</label>
                <input
                  type="text"
                  id="creatorName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={20}
                  required
                  autoComplete="off"
                  name="game-player-name"
                />
              </div>

              <div className="create-info">
                <div className="info-item">
                  <span className="info-icon">👑</span>
                  <span>You'll be the room creator with full control</span>
                </div>
                <div className="info-item">
                  <span className="info-icon">🎯</span>
                  <span>Set the number of rounds (1-10)</span>
                </div>
                <div className="info-item">
                  <span className="info-icon">🔗</span>
                  <span>Get a unique room code to share</span>
                </div>
              </div>

              <button type="submit" className="create-room-btn">
                🎮 Create Room
              </button>
            </form>
          </div>
        )}

        {activeTab === 'join' && (
          <div className="tab-content">
            <div className="tab-header">
              <h3>Join an Existing Room</h3>
              <p>Enter a room code to join the fun!</p>
            </div>

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
                  autoComplete="off"
                  name="game-player-name"
                />
              </div>

              <div className="input-group">
                <label htmlFor="roomId">Room Code:</label>
                <input
                  type="text"
                  id="roomId"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character room code"
                  maxLength={6}
                  required
                  autoComplete="off"
                />
              </div>

              {displayError && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  <span>{displayError}</span>
                </div>
              )}

              <div className="join-buttons">
                <button type="submit" className="join-btn">
                  🎮 Join as Player
                </button>
                <button type="button" onClick={handleSpectatorJoin} className="spectator-btn">
                  👁️ Join as Spectator
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="game-rules">
          <h3>🎮 How to Play</h3>
          <div className="rules-content">
            <div className="rule-section">
              <h4>📝 Game Flow</h4>
              <ul>
                <li><strong>Create Prompt:</strong> One player writes a short prompt (max 20 characters)</li>
                <li><strong>AI Magic:</strong> AI generates an image from the prompt</li>
                <li><strong>Guess Time:</strong> Other players guess the original prompt (max 20 characters)</li>
                <li><strong>Score Points:</strong> Earn points based on how close your guess is!</li>
                <li><strong>Rotate Turns:</strong> Everyone gets to be the prompt creator</li>
              </ul>
            </div>

            <div className="rule-section">
              <h4>⏱️ Timing</h4>
              <ul>
                <li><strong>Prompt Phase:</strong> 30 seconds to create your prompt</li>
                <li><strong>Guessing Phase:</strong> 30 seconds to guess the prompt</li>
                <li><strong>Results:</strong> 8 seconds to review scores and see the original prompt</li>
              </ul>
            </div>

            <div className="rule-section">
              <h4>🏆 Scoring System</h4>
              <ul>
                <li><strong>90-100% match:</strong> Full points (90-100)</li>
                <li><strong>70-89% match:</strong> Great score (63-80 points)</li>
                <li><strong>50-69% match:</strong> Good score (40-55 points)</li>
                <li><strong>30-49% match:</strong> Decent score (21-34 points)</li>
                <li><strong>20-29% match:</strong> Some points (12-17 points)</li>
                <li><strong>Speed Bonus:</strong> First 3 good guesses get bonus points!</li>
              </ul>
            </div>

            <div className="rule-section">
              <h4>💡 Pro Tips</h4>
              <ul>
                <li>You can submit multiple guesses - keep trying!</li>
                <li>Think about synonyms and alternative words</li>
                <li>Simple, clear prompts work best for AI</li>
                <li>Speed matters - quick accurate guesses get bonus points</li>
                <li>2-8 players can join a room</li>
              </ul>
            </div>

            <div className="rule-section">
              <h4>⚠️ Important Notice</h4>
              <ul>
                <li><strong>No Rejoining:</strong> Once you leave a room during a game, you cannot rejoin</li>
                <li><strong>Stay Connected:</strong> Make sure you have a stable connection before starting</li>
                <li><strong>Game Continues:</strong> If someone leaves, the game continues with remaining players</li>
                <li><strong>New Game:</strong> If you need to leave, you'll need to create or join a new room</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameLobby;