import React from 'react';

function PlayerList({ players, showScores = false, showReady = false }) {
  return (
    <div className="player-list">
      <h4>Players ({players.length})</h4>
      <div className="players">
        {players.map((player) => (
          <div key={player.id} className={`player ${player.isPromptGiver ? 'prompt-giver' : ''} ${player.isReady ? 'ready' : ''}`}>
            <div className="player-info">
              <span className="player-name">{player.name}</span>
              {player.isPromptGiver && <span className="role-badge">Prompt Giver</span>}
              {showReady && (
                <span className={`ready-badge ${player.isReady ? 'ready' : 'not-ready'}`}>
                  {player.isReady ? '✓ Ready' : '⏳ Not Ready'}
                </span>
              )}
            </div>
            {showScores && (
              <div className="player-score">{player.score} pts</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlayerList;