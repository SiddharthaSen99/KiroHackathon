import React, { useState, useEffect } from 'react';
import PromptInput from './PromptInput';
import GuessInput from './GuessInput';
import PlayerList from './PlayerList';
import GameImage from './GameImage';

function GameRoom({ players, currentPlayer, roomId, onToggleReady, allReady, socket, isPlaying = false, initialGameData = null }) {
  const [gameData, setGameData] = useState(initialGameData || {
    currentPromptGiver: null,
    currentImage: '',
    currentPrompt: '',
    timeRemaining: 30,
    promptTimeRemaining: 30,
    round: 0,
    maxRounds: 5,
    gameState: 'waiting'
  });
  const [guesses, setGuesses] = useState([]);

  // Update game data when initial data is provided
  useEffect(() => {
    if (initialGameData) {
      console.log('Setting initial game data:', initialGameData);
      setGameData(initialGameData);
    }
  }, [initialGameData]);

  useEffect(() => {
    console.log('GameRoom useEffect - isPlaying:', isPlaying);
    
    // Clean up listeners (but NOT game_started unless we're playing)
    socket.off('next_round');
    socket.off('prompt_submitted');
    socket.off('guess_submitted');
    socket.off('round_ended');
    socket.off('game_finished');
    socket.off('timer_update');

    // Only register game_started listener if we're actually playing
    if (isPlaying) {
      console.log('GameRoom: Registering game_started listener');
      // Only clean up game_started if we're going to register it
      socket.off('game_started');
      
      socket.on('game_started', (data) => {
        console.log('GameRoom received game_started:', data);
        setGameData(prev => ({
          ...prev,
          currentPromptGiver: data.currentPromptGiver,
          round: data.round,
          gameState: 'waiting_for_prompt'
        }));
      });
    } else {
      console.log('GameRoom: NOT registering game_started listener (not playing)');
    }

    socket.on('next_round', (data) => {
      console.log('Next round starting:', data);
      console.log('New prompt giver:', data.currentPromptGiver);
      console.log('Current player ID:', currentPlayer?.id);
      console.log('Should show prompt input:', data.currentPromptGiver === currentPlayer?.id);
      
      setGameData(prev => ({
        ...prev,
        currentPromptGiver: data.currentPromptGiver,
        round: data.round,
        maxRounds: data.maxRounds,
        gameState: data.gameState,
        currentImage: '',
        currentPrompt: '',
        timeRemaining: 30,
        roundResults: null
      }));
      setGuesses([]);
    });

    socket.on('prompt_submitted', (data) => {
      console.log('Prompt submitted event received:', data);
      setGameData(prev => {
        const newGameData = {
          ...prev,
          currentImage: data.imageUrl,
          gameState: 'guessing',
          timeRemaining: data.timeRemaining || 30
        };
        console.log('Updated game data:', newGameData);
        return newGameData;
      });
    });

    socket.on('guess_submitted', (data) => {
      console.log('Guess submitted event received:', data);
      setGuesses(prev => {
        const newGuesses = [...prev, data];
        console.log('Updated guesses:', newGuesses);
        return newGuesses;
      });
    });

    socket.on('round_ended', (data) => {
      console.log('Round ended:', data);
      console.log('Guesses received:', data.guesses);
      console.log('Guesses type:', typeof data.guesses);
      console.log('Guesses is array:', Array.isArray(data.guesses));
      
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
      setGameData(prev => ({
        ...prev,
        gameState: 'finished'
      }));
    });

    socket.on('timer_update', (data) => {
      setGameData(prev => ({
        ...prev,
        timeRemaining: data.timeRemaining
      }));
    });

    socket.on('prompt_timer_update', (data) => {
      setGameData(prev => ({
        ...prev,
        promptTimeRemaining: data.timeRemaining
      }));
    });

    return () => {
      console.log('GameRoom cleanup - isPlaying:', isPlaying);
      // Only clean up game_started if we registered it (when isPlaying is true)
      if (isPlaying) {
        socket.off('game_started');
      }
      socket.off('next_round');
      socket.off('prompt_submitted');
      socket.off('guess_submitted');
      socket.off('round_ended');
      socket.off('game_finished');
      socket.off('timer_update');
      socket.off('prompt_timer_update');
    };
  }, [socket, isPlaying]);

  const isCurrentPlayerPromptGiver = () => {
    console.log('🔍 Checking if current player is prompt giver:');
    console.log('  currentPlayer:', currentPlayer);
    console.log('  currentPlayer.id:', currentPlayer?.id);
    console.log('  gameData.currentPromptGiver:', gameData.currentPromptGiver);
    console.log('  socket.id:', socket.id);
    console.log('  Match with currentPlayer.id:', currentPlayer && gameData.currentPromptGiver === currentPlayer.id);
    console.log('  Match with socket.id:', gameData.currentPromptGiver === socket.id);
    
    // Try both currentPlayer.id and socket.id
    return gameData.currentPromptGiver === socket.id || (currentPlayer && gameData.currentPromptGiver === currentPlayer.id);
  };

  const canStartGame = players.length >= 2;
  const currentPlayerData = players.find(p => p.id === currentPlayer?.id);
  const isCurrentPlayerReady = currentPlayerData?.isReady || false;
  const readyCount = players.filter(p => p.isReady).length;

  if (!isPlaying) {
    return (
      <div className="game-room">
        <div className="room-header">
          <h2>Room: {roomId}</h2>
          <p>Players: {players.length}</p>
          <p>Ready: {readyCount}/{players.length}</p>
        </div>
        
        <PlayerList players={players} showReady={true} />
        
        {canStartGame && !allReady && (
          <button 
            onClick={onToggleReady} 
            className={`ready-btn ${isCurrentPlayerReady ? 'ready' : 'not-ready'}`}
          >
            {isCurrentPlayerReady ? 'Not Ready' : 'Ready'}
          </button>
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
          <span>Round {gameData.round}</span>
          <span className="timer">Time: {gameData.timeRemaining}s</span>
        </div>
      </div>
      
      <div className="game-content">
        <div className="left-panel">
          <PlayerList players={players} showScores={true} />
        </div>
        
        <div className="center-panel">
          {/* Debug info */}
          <div style={{background: 'rgba(0,0,0,0.3)', padding: '10px', marginBottom: '10px', fontSize: '8px'}}>
            <div>Game State: {gameData.gameState}</div>
            <div>Current Player: {currentPlayer?.name}</div>
            <div>Is Prompt Giver: {isCurrentPlayerPromptGiver() ? 'YES' : 'NO'}</div>
            <div>Round: {gameData.round}</div>
            <div>Prompt Giver ID: {gameData.currentPromptGiver}</div>
          </div>
          
          {gameData.gameState === 'waiting_for_prompt' && isCurrentPlayerPromptGiver() && (
            <PromptInput socket={socket} roomId={roomId} />
          )}
          
          {gameData.gameState === 'waiting_for_prompt' && !isCurrentPlayerPromptGiver() && (
            <div className="waiting-prompt">
              <p>Waiting for prompt giver to submit their prompt...</p>
            </div>
          )}
          
          {gameData.currentImage && (
            <GameImage imageUrl={gameData.currentImage} />
          )}
          
          {gameData.gameState === 'round_results' && gameData.roundResults && (
            <div className="round-results">
              <h3>Round {gameData.roundResults.round} Results</h3>
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
                <p>Next round starts in a few seconds...</p>
                {gameData.round < gameData.maxRounds && (
                  <p>Next prompt giver: {players.find(p => p.id === gameData.currentPromptGiver)?.name}</p>
                )}
              </div>
            </div>
          )}
          
          {gameData.gameState === 'finished' && (
            <div className="game-finished">
              <h2>Game Finished!</h2>
              <div className="final-scores">
                {players
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => (
                    <div key={player.id} className={`final-score ${index === 0 ? 'winner' : ''}`}>
                      <span>{index + 1}. {player.name}</span>
                      <span>{player.score} points</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="right-panel">
          {gameData.gameState === 'guessing' && !isCurrentPlayerPromptGiver() && (
            <GuessInput 
              socket={socket} 
              roomId={roomId} 
              timeRemaining={gameData.timeRemaining}
              currentPlayer={currentPlayer}
            />
          )}
          
          {gameData.gameState === 'guessing' && (
            <div className="guesses-list">
              <h4>Guesses ({guesses.length}):</h4>
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
                  <p>No guesses yet...</p>
                  <p>Be the first to guess!</p>
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