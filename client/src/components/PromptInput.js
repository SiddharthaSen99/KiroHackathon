import React, { useState, useEffect } from 'react';

function PromptInput({ socket, roomId }) {
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const maxChars = 20;

  useEffect(() => {
    socket.on('prompt_timer_update', (data) => {
      setTimeRemaining(data.timeRemaining);
    });

    // Don't listen to prompt_submitted here to avoid conflicts with GameRoom
    // Use timeout instead for submission state

    return () => {
      socket.off('prompt_timer_update');
    };
  }, [socket]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (prompt.length > maxChars) {
      alert(`Prompt must be ${maxChars} characters or less!`);
      return;
    }
    
    if (prompt.trim()) {
      setIsSubmitting(true);
      socket.emit('submit_prompt', { roomId, prompt: prompt.trim() });
      
      // Reset submitting state after a delay
      setTimeout(() => {
        setIsSubmitting(false);
      }, 1000);
    }
  };

  const isOverLimit = prompt.length > maxChars;

  return (
    <div className="prompt-input-container">
      <h3>Your turn to create a prompt!</h3>
      <div className="prompt-timer">
        <span className={`timer ${timeRemaining <= 10 ? 'urgent' : ''}`}>
          Time: {timeRemaining}s
        </span>
      </div>
      <p>Create a short prompt for AI image generation (max {maxChars} characters)</p>
      
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. red dragon, sunset..."
            disabled={isSubmitting || timeRemaining <= 0}
            maxLength={maxChars + 5} // Allow a bit extra for validation
            className="prompt-input"
          />
          <div className={`char-count ${isOverLimit ? 'over-limit' : ''}`}>
            {prompt.length}/{maxChars} characters
          </div>
        </div>
        
        <div className="prompt-buttons">
          <button 
            type="submit" 
            disabled={!prompt.trim() || isOverLimit || isSubmitting || timeRemaining <= 0}
            className="submit-prompt-btn"
          >
            {isSubmitting ? 'Generating Image...' : 'Submit Prompt'}
          </button>
          
          <button 
            type="button"
            onClick={() => {
              if (!isSubmitting && timeRemaining > 0) {
                setIsSubmitting(true);
                socket.emit('submit_prompt', { roomId, prompt: prompt.trim() || 'random', useRandomImage: true });
              }
            }}
            disabled={isSubmitting || timeRemaining <= 0}
            className="random-image-btn"
          >
            {isSubmitting ? 'Loading...' : 'Random Image (Test)'}
          </button>
        </div>
      </form>
      
      <div className="prompt-tips">
        <h4>Quick Tips:</h4>
        <ul>
          <li>Keep it simple and visual</li>
          <li>Use objects, animals, or scenes</li>
          <li>Add colors or emotions</li>
          <li>Make it guessable!</li>
        </ul>
      </div>
    </div>
  );
}

export default PromptInput;