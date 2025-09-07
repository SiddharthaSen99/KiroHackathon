import React, { useState, useEffect } from 'react';
import PromptInput from './PromptInput';
import GuessInput from './GuessInput';
import PlayerList from './PlayerList';
import GameImage from './GameImage';
import soundManager from '../utils/soundManager';

function GameRoom({ players, spectators = [], currentPlayer, roomId, onToggleReady, allReady, socket, isPlaying = false, initialGameData = null, onUpdatePlayers, isSpectator = false, maxRoundsFromParent = 5 }) {
  const [gameData, setGameData] = useState(initialGameData || {
    currentPromptGiver: null,
    currentImage: '',
    currentPrompt: '',
    timeRemaining: 30,
    promptTimeRemaining: 30,
    round: 0,
    maxRounds: 5,
    gameState: 'waiting',
    currentTurnIndex: 0,
    turnsCompletedInRound: 0,
    totalPlayersInRound: players?.length || 0
  });
  const [guesses, setGuesses] = useState([]);
  const [maxRounds, setMaxRounds] = useState(maxRoundsFromParent);

  // Update game data when initial data is provided
  useEffect(() => {
    if (initialGameData) {
      setGameData(prev => ({
        ...prev,
        ...initialGameData
      }));
    }
  }, [initialGameData]);

  // Update maxRounds when prop changes
  useEffect(() => {
    console.log('GameRoom: maxRoundsFromParent changed to:', maxRoundsFromParent);
    setMaxRounds(maxRoundsFromParent);
    setGameData(prev => ({
      ...prev,
      maxRounds: maxRoundsFromParent
    }));
  }, [maxRoundsFromParent]);

  useEffect(() => {
    // Clean up listeners (but NOT game_started unless we're playing)
    socket.off('next_turn');
    socket.off('prompt_submitted');
    socket.off('guess_submitted');
    socket.off('round_ended');
    socket.off('game_finished');
    socket.off('game_state_sync');
    socket.off('timer_update');

    // Only register game_started listener if we're actually playing
    if (isPlaying) {
      // Only clean up game_started if we're going to register it
      socket.off('game_started');

      socket.on('game_started', (data) => {
        soundManager.playGameStart();
        setGameData(prev => ({
          ...prev,
          currentPromptGiver: data.currentPromptGiver,
          round: data.round,
          gameState: 'waiting_for_prompt',
          currentTurnIndex: data.currentTurnIndex,
          turnsCompletedInRound: data.turnsCompletedInRound,
          totalPlayersInRound: data.totalPlayersInRound
        }));
      });
    }



    socket.on('next_turn', (data) => {
      // Update players with current scores
      if (onUpdatePlayers && data.players) {
        onUpdatePlayers(data.players);
      }

      setGameData(prev => ({
        ...prev,
        currentPromptGiver: data.currentPromptGiver,
        round: data.round,
        maxRounds: data.maxRounds,
        gameState: data.gameState,
        currentImage: '',
        currentPrompt: '',
        timeRemaining: 30,
        roundResults: null,
        currentTurnIndex: data.currentTurnIndex,
        turnsCompletedInRound: data.turnsCompletedInRound,
        totalPlayersInRound: data.totalPlayersInRound
      }));
      setGuesses([]);
    });

    socket.on('prompt_submitted', (data) => {
      soundManager.playPromptSubmitted();
      setGameData(prev => ({
        ...prev,
        currentImage: data.imageUrl,
        gameState: 'guessing',
        timeRemaining: data.timeRemaining || 30
      }));
    });

    socket.on('guess_submitted', (data) => {
      soundManager.playGuessSubmitted();
      setGuesses(prev => [...prev, data]);
    });

    socket.on('round_ended', (data) => {
      soundManager.playRoundEnd();
      // Update players with new scores
      if (onUpdatePlayers && data.players) {
        onUpdatePlayers(data.players);
      }

      setGameData(prev => ({
        ...prev,
        currentPrompt: data.originalPrompt,
        gameState: 'round_results',
        roundResults: {
          ...data,
          guesses: data.guesses || [] // Ensure it's always an array
        }
      }));
    });

    socket.on('game_finished', (data) => {
      console.log('Game finished event received:', data);
      soundManager.playGameEnd();
      setGameData(prev => ({
        ...prev,
        gameState: 'finished',
        finalPlayers: data.players,
        winner: data.winner
      }));
    });

    // Handle game state synchronization for reconnecting players
    socket.on('game_state_sync', (data) => {
      console.log('Received game state sync:', data);
      setGameData(prev => ({
        ...prev,
        ...data,
        // Preserve any existing round results if not provided
        roundResults: data.roundResults || prev.roundResults
      }));
      
      // Update players if provided
      if (data.players && onUpdatePlayers) {
        onUpdatePlayers(data.players);
      }
      
      // If there are guesses, update the guesses state
      if (data.guesses) {
        setGuesses(data.guesses);
      }
    });

    socket.on('timer_update', (data) => {
      setGameData(prev => ({
        ...prev,
        timeRemaining: data.timeRemaining
      }));
      
      // Play countdown sound for last 5 seconds
      if (data.timeRemaining <= 5 && data.timeRemaining > 0) {
        soundManager.playCountdown(data.timeRemaining);
      }
    });

    socket.on('prompt_timer_update', (data) => {
      setGameData(prev => ({
        ...prev,
        promptTimeRemaining: data.timeRemaining
      }));
      
      // Play countdown sound for last 5 seconds during prompt phase
      if (data.timeRemaining <= 5 && data.timeRemaining > 0) {
        soundManager.playCountdown(data.timeRemaining);
      }
    });

    return () => {
      // Only clean up game_started if we registered it (when isPlaying is true)
      if (isPlaying) {
        socket.off('game_started');
      }
      socket.off('next_turn');
      socket.off('prompt_submitted');
      socket.off('guess_submitted');
      socket.off('round_ended');
      socket.off('game_finished');
      socket.off('game_state_sync');
      socket.off('timer_update');
      socket.off('prompt_timer_update');
    };
  }, [socket, isPlaying]);

  const isCurrentPlayerPromptGiver = () => {
    // Try both currentPlayer.id and socket.id
    return gameData.currentPromptGiver === socket.id || (currentPlayer && gameData.currentPromptGiver === currentPlayer.id);
  };

  const canStartGame = players.length >= 2;
  const currentPlayerData = players.find(p => p.id === currentPlayer?.id);
  const isCurrentPlayerReady = currentPlayerData?.isReady || false;
  const readyCount = players.filter(p => p.isReady).length;
  const isRoomCreator = currentPlayerData?.isRoomCreator || false;

  const handleMaxRoundsChange = (newMaxRounds) => {
    console.log('GameRoom: handleMaxRoundsChange called with:', newMaxRounds, 'current maxRounds:', maxRounds);
    if (isRoomCreator && !allReady && newMaxRounds !== maxRounds) {
      console.log('GameRoom: Emitting set_max_rounds event');
      socket.emit('set_max_rounds', { roomId, maxRounds: newMaxRounds });
    } else {
      console.log('GameRoom: Not emitting because:', { isRoomCreator, allReady, sameValue: newMaxRounds === maxRounds });
    }
  };

  if (!isPlaying) {
    return (
      <div className="game-room">
        <div className="room-header">
          <h2>Room: {roomId}</h2>
          <p>Players: {players.length}</p>
          {spectators.length > 0 && <p>Spectators: {spectators.length}</p>}
          <p>Ready: {readyCount}/{players.length}</p>
        </div>

        <PlayerList players={players} spectators={spectators} showReady={true} />

        {!isSpectator && isRoomCreator && !allReady && (
          <div className="game-settings">
            <div className="rounds-selector">
              <label htmlFor="maxRounds">Number of Rounds:</label>
              <div className="rounds-controls">
                <button
                  className="rounds-btn decrease"
                  onClick={() => handleMaxRoundsChange(Math.max(1, maxRounds - 1))}
                  disabled={maxRounds <= 1}
                >
                  -
                </button>
                <span className="rounds-display">{maxRounds}</span>
                <button
                  className="rounds-btn increase"
                  onClick={() => handleMaxRoundsChange(Math.min(10, maxRounds + 1))}
                  disabled={maxRounds >= 10}
                >
                  +
                </button>
              </div>
              <div className="rounds-info">
                <small>🎮 As room creator, you can set 1-10 rounds</small>
              </div>
            </div>
          </div>
        )}

        {!isSpectator && !isRoomCreator && !allReady && (
          <div className="game-settings">
            <div className="rounds-display-only">
              <span>Rounds: {maxRounds}</span>
              <small>🎯 Set by room creator</small>
            </div>
          </div>
        )}

        {!isSpectator && canStartGame && !allReady && (
          <button
            onClick={onToggleReady}
            className={`ready-btn ${isCurrentPlayerReady ? 'ready' : 'not-ready'}`}
          >
            {isCurrentPlayerReady ? 'Not Ready' : 'Ready'}
          </button>
        )}

        {isSpectator && (
          <div className="spectator-message">
            <p>👁️ You are watching as a spectator</p>
            <p>Waiting for players to start the game...</p>
          </div>
        )}

        {allReady && (
          <div className="starting-message">
            <p>All players ready! Starting game...</p>
            <div className="loading-spinner"></div>
          </div>
        )}

        {!canStartGame && (
          <p className="waiting-message">
            Waiting for at least 2 players to start...
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="game-room playing">
      <div className="game-header">
        <div className="round-info">
          <span>
            Round {gameData.round} of {gameData.maxRounds}
            {gameData.totalPlayersInRound > 0 && (
              <span className="turn-info"> - Turn {(gameData.turnsCompletedInRound || 0) + 1} of {gameData.totalPlayersInRound}</span>
            )}
          </span>
        </div>
        <div className="header-right">
          <span className={`timer ${
            (gameData.gameState === 'waiting_for_prompt' ? gameData.promptTimeRemaining : gameData.timeRemaining) <= 5 
              ? 'countdown-warning' 
              : ''
          }`}>
            Time: {gameData.gameState === 'waiting_for_prompt' ? gameData.promptTimeRemaining : gameData.timeRemaining}s
          </span>
          <div className="sound-controls">
            <button
              className={`sound-toggle ${soundManager.isEnabled() ? 'enabled' : 'disabled'}`}
              onClick={() => soundManager.setEnabled(!soundManager.isEnabled())}
              title={soundManager.isEnabled() ? 'Disable sounds' : 'Enable sounds'}
            >
              {soundManager.isEnabled() ? '🔊' : '🔇'}
            </button>
          </div>
        </div>
      </div>

      <div className="game-content">
        <div className="left-panel">
          <PlayerList players={players} spectators={spectators} showScores={true} />
          {isSpectator && (
            <div className="spectator-indicator">
              <p>👁️ Spectating</p>
            </div>
          )}
        </div>

        <div className="center-panel">

          {gameData.gameState === 'waiting_for_prompt' && !isSpectator && isCurrentPlayerPromptGiver() && (
            <PromptInput socket={socket} roomId={roomId} />
          )}

          {gameData.gameState === 'waiting_for_prompt' && (!isCurrentPlayerPromptGiver() || isSpectator) && (
            <div className="waiting-prompt">
              <p>Waiting for prompt giver to submit their prompt...</p>
              {isSpectator && <p className="spectator-note">👁️ You are spectating this game</p>}
            </div>
          )}

          {gameData.currentImage && (
            <GameImage imageUrl={gameData.currentImage} />
          )}

          {gameData.gameState === 'finished' && (
            <div className="game-finished">
              <div className="game-complete-header">
                <h2>🎉 Game Complete! 🎉</h2>
                <p>All {gameData.maxRounds} rounds finished!</p>
              </div>

              {(() => {
                // Use finalPlayers from game data if available, otherwise fall back to sorted players
                const sortedPlayers = gameData.finalPlayers || [...players].sort((a, b) => b.score - a.score);
                const winner = gameData.winner || sortedPlayers[0];
                const hasWinner = sortedPlayers.length > 0;

                return (
                  <>
                    {hasWinner && (
                      <div className="winner-announcement">
                        <h3>🏆 Winner: {winner.name}! 🏆</h3>
                        <p className="winner-score">{winner.score} points</p>
                      </div>
                    )}

                    <div className="final-rankings">
                      <h4>Final Rankings:</h4>
                      <div className="rankings-list">
                        {sortedPlayers.map((player, index) => (
                          <div key={player.id} className={`ranking-item ${index === 0 ? 'first-place' : index === 1 ? 'second-place' : index === 2 ? 'third-place' : ''}`}>
                            <div className="rank-position">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                            </div>
                            <div className="player-info">
                              <span className="player-name">{player.name}</span>
                              <span className="player-score">{player.score} points</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="game-stats">
                      <p>Thanks for playing! 🎨</p>
                      <p>Total rounds played: {gameData.maxRounds}</p>
                      <p>Players: {players.length}</p>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {gameData.gameState === 'round_results' && gameData.roundResults && (
            <div className="round-results">
              <h3>Round {gameData.roundResults.round} of {gameData.maxRounds} Results</h3>
              <div className="original-prompt">
                <h4>Original Prompt: "{gameData.roundResults.originalPrompt}"</h4>
              </div>

              <div className="guesses-results">
                <h4>Guesses & Scores:</h4>
                {gameData.roundResults.guesses?.length > 0 ? (
                  gameData.roundResults.guesses.map((guess, index) => (
                    <div key={index} className={`guess-result ${index === 0 ? 'best-guess' : ''}`}>
                      <span className="guess-content">
                        <span className="player-name">{guess.playerName}:</span>
                        <span className="guess-text">"{guess.guess}"</span>
                      </span>
                      <span className={`score ${guess.score >= 80 ? 'excellent' : guess.score >= 60 ? 'good' : guess.score >= 40 ? 'okay' : 'poor'}`}>
                        {guess.score}%
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="no-guesses">No guesses were submitted this round!</p>
                )}
              </div>

              <div className="next-round-info">
                <p>Next turn starts in a few seconds...</p>
                {gameData.round <= gameData.maxRounds && (
                  <p>Next prompt giver: {players.find(p => p.id === gameData.currentPromptGiver)?.name}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="right-panel">
          {gameData.gameState === 'guessing' && !isSpectator && !isCurrentPlayerPromptGiver() && (
            <GuessInput
              socket={socket}
              roomId={roomId}
              timeRemaining={gameData.timeRemaining}
              currentPlayer={currentPlayer}
            />
          )}

          {gameData.gameState === 'guessing' && isSpectator && (
            <div className="spectator-guessing">
              <p>👁️ Spectating</p>
              <p>Watch the players guess!</p>
            </div>
          )}

          {gameData.gameState === 'guessing' && (
            <div className="guesses-list">
              <h4>{isCurrentPlayerPromptGiver() ? `🧠 Guesses (${guesses.length}):` : `Guesses (${guesses.length}):`}</h4>
              {guesses.length > 0 ? (
                <div className="guesses-container">
                  {guesses.map((guess, index) => (
                    <div key={index} className="guess-item">
                      <span className="player-name">{guess.playerName}:</span>
                      <span className="guess-text">{guess.guess}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-guesses">
                  {isCurrentPlayerPromptGiver() ? (
                    <>
                      <p>🎯 Watch the minds at work...</p>
                      <p>See how close they get to your vision!</p>
                    </>
                  ) : (
                    <>
                      <p>No guesses yet...</p>
                      <p>Be the first to guess!</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GameRoom;