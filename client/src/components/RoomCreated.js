import React, { useState } from 'react';

function RoomCreated({ roomId, players, onContinue }) {
  const [copied, setCopied] = useState(false);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="room-created">
      <div className="room-created-container">
        <div className="success-header">
          <h2>🎉 Room Created Successfully! 🎉</h2>
          <p>You are now the room creator with full control over game settings.</p>
        </div>

        <div className="room-info">
          <div className="room-code-section">
            <h3>Room Code</h3>
            <div className="room-code-display">
              <span className="room-code">{roomId}</span>
              <button
                className={`copy-btn ${copied ? 'copied' : ''}`}
                onClick={copyRoomCode}
              >
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
          </div>

          <div className="share-section">
            <h3>Share with Friends</h3>
            <div className="share-options">
              <div className="share-url">
                <input
                  type="text"
                  value={window.location.origin}
                  readOnly
                  className="share-input"
                />
                <button
                  className={`copy-btn ${copied ? 'copied' : ''}`}
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    });
                  }}
                >
                  {copied ? '✓ Copied!' : '📋 Copy Link'}
                </button>
              </div>
            </div>
          </div>

          <div className="instructions">
            <h3>How to Invite Players</h3>
            <div className="instruction-list">
              <div className="instruction-item">
                <span className="step-number">1</span>
                <span>Send the game link above to your friends</span>
              </div>
              <div className="instruction-item">
                <span className="step-number">2</span>
                <span>Share the room code <strong>{roomId}</strong> with them</span>
              </div>
              <div className="instruction-item">
                <span className="step-number">3</span>
                <span>They enter the room code on the main page to join</span>
              </div>
              <div className="instruction-item">
                <span className="step-number">4</span>
                <span>You can set the number of rounds once everyone joins</span>
              </div>
            </div>
          </div>

          <div className="current-players">
            <h3>Current Players ({players.length})</h3>
            <div className="players-list">
              {players.map(player => (
                <div key={player.id} className={`player-item ${player.isRoomCreator ? 'creator' : ''}`}>
                  <span className="player-name">
                    {player.name} {player.isRoomCreator && '👑'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="continue-section">
          <button className="continue-btn" onClick={onContinue}>
            🚀 Continue to Room
          </button>
          <p className="continue-note">
            You can continue to the room and wait for others to join, or share the code first.
          </p>
        </div>
      </div>
    </div>
  );
}

export default RoomCreated;