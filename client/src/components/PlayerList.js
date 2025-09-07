import React from 'react';

function PlayerList({ players, spectators = [], showScores = false, showReady = false }) {
  return (
    <div className="player-list">
      <h4>Players ({players.length})</h4>
      <div className="players">
        {players.map((player) => (
          <div key={player.id} className={`player ${player.isPromptGiver ? 'prompt-giver' : ''} ${player.isReady ? 'ready' : ''} ${player.isConnected === false ? 'disconnected' : ''}`}>
            <div className="player-info">
              <span className="player-name">
                {player.name}
                {player.isConnected === false && <span className="disconnect-indicator">🔌</span>}
              </span>
              {player.isPromptGiver && <span className="role-badge">Prompt Giver</span>}
              {showReady && (
                <span className={`ready-badge ${player.isReady ? 'ready' : 'not-ready'}`}>
                  {player.isReady ? '✓ Ready' : '⏳ Not Ready'}
                </span>
              )}
              {player.isConnected === false && (
                <span className="connection-status">Disconnected</span>
              )}
            </div>
            {showScores && (
              <div className="player-score">{player.score} pts</div>
            )}
          </div>
        ))}
      </div>
      
      {spectators.length > 0 && (
        <div className="spectator-section">
          <h4>Spectators ({spectators.length})</h4>
          <div className="spectators">
            {spectators.map((spectator) => (
              <div key={spectator.id} className="spectator">
                <div className="spectator-info">
                  <span className="spectator-name">👁️ {spectator.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerList;