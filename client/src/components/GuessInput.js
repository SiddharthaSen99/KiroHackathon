import React, { useState, useEffect } from 'react';

function GuessInput({ socket, roomId, timeRemaining, currentPlayer }) {
  const [guess, setGuess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset submitting state after a short delay instead of listening to socket events
  // to avoid conflicts with GameRoom's guess_submitted listener

  const handleSubmit = (e) => {
    e.preventDefault();
    if (guess.trim() && !isSubmitting && timeRemaining > 0) {
      setIsSubmitting(true);
      socket.emit('submit_guess', { 
        roomId, 
        guess: guess.trim(),
        playerName: currentPlayer?.name || 'Anonymous'
      });
      setGuess('');
      
      // Reset submitting state after a short delay
      setTimeout(() => {
        setIsSubmitting(false);
      }, 500);
    }
  };

  return (
    <div className="guess-input-container">
      <h4>What do you think this image shows?</h4>
      <div className="guess-timer">
        <span className={`timer ${timeRemaining <= 10 ? 'urgent' : ''}`}>
          Time: {timeRemaining}s
        </span>
      </div>
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Enter your guess..."
          maxLength={50}
          disabled={isSubmitting || timeRemaining <= 0}
          className="guess-input"
        />
        <button 
          type="submit" 
          disabled={!guess.trim() || isSubmitting || timeRemaining <= 0}
          className="submit-guess-btn"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Guess'}
        </button>
      </form>
      
      <div className="guess-tips">
        <p>💡 You can submit multiple guesses! Keep trying different words.</p>
      </div>
    </div>
  );
}

export default GuessInput;