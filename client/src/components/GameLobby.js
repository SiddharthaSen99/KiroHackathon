import React, { useState } from 'react';

function GameLobby({ onJoinRoom, onJoinAsSpectator, onCreateRoom, error: externalError, onClearError }) {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [activeTab, setActiveTab] = useState('join'); // 'join' or 'create'
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Use external error if provided, otherwise use internal error
  const displayError = externalError || error;

  // Clear errors when switching tabs or typing
  const clearErrors = () => {
    setError('');
    if (onClearError) onClearError();
  };

  // Tutorial slides data
  const tutorialSlides = [
    {
      title: "📝 Game Flow",
      icon: "🎮",
      content: [
        "One player creates a prompt (max 20 characters)",
        "AI generates an image from that prompt",
        "Other players try to guess the original prompt",
        "Points awarded based on accuracy and speed",
        "Everyone takes turns being the prompt creator"
      ]
    },
    {
      title: "⏱️ Timing",
      icon: "⏰",
      content: [
        "Prompt Phase: 30 seconds to create your prompt",
        "Guessing Phase: 30 seconds to guess the prompt",
        "Quick thinking gets bonus points!"
      ]
    },
    {
      title: "🏆 Scoring System",
      icon: "🎯",
      content: [
        "Guessers: 90-100% match = Full points (90-100)",
        "70-89% match: Great score (63-80 points)",
        "50-69% match: Good score (40-55 points)",
        "30-49% match: Decent score (21-34 points)",
        "Prompt Giver: More points for challenging (but fair) prompts",
        "Speed Bonus: First 3 good guesses get extra points!"
      ]
    },
    {
      title: "✍️ Creating Good Prompts",
      icon: "💭",
      content: [
        "Make prompts challenging but fair - not too easy or impossible",
        "Avoid gibberish or made-up words (you'll get 0 points!)",
        "Think descriptive but concise (max 20 characters)",
        "Sweet spot: Hard enough that people struggle but can still guess",
        "Examples: 'red sports car', 'happy dog', 'sunset beach'"
      ]
    },
    {
      title: "💡 Pro Tips",
      icon: "🧠",
      content: [
        "Guessers: Submit multiple guesses - keep trying!",
        "Think about synonyms and alternative phrasings",
        "Prompt Givers: Clear, descriptive prompts work best",
        "Speed matters - first correct guesses get bonus points",
        "2-8 players can join a room"
      ]
    },
    {
      title: "⚠️ Important Notice",
      icon: "🚨",
      content: [
        "No Rejoining: Once you leave during a game, you cannot rejoin",
        "Stay Connected: Make sure you have stable connection",
        "Game Continues: If someone leaves, game continues",
        "New Game: You'll need to create/join a new room if you leave"
      ]
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % tutorialSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + tutorialSlides.length) % tutorialSlides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
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

        <div className="tutorial-section">
          <h3>🎮 How to Play</h3>
          
          <div className="tutorial-slider">
            <div className="slide-container">
              <div 
                className="slides-wrapper" 
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {tutorialSlides.map((slide, index) => (
                  <div key={index} className="tutorial-slide">
                    <div className="slide-header">
                      <div className="slide-icon">{slide.icon}</div>
                      <h4>{slide.title}</h4>
                    </div>
                    <div className="slide-content">
                      <ul>
                        {slide.content.map((item, itemIndex) => (
                          <li key={itemIndex}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="tutorial-controls">
              <button 
                className="nav-btn prev-btn" 
                onClick={prevSlide}
                aria-label="Previous slide"
              >
                ◀
              </button>
              
              <div className="slide-indicators">
                {tutorialSlides.map((_, index) => (
                  <button
                    key={index}
                    className={`indicator ${index === currentSlide ? 'active' : ''}`}
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
              
              <button 
                className="nav-btn next-btn" 
                onClick={nextSlide}
                aria-label="Next slide"
              >
                ▶
              </button>
            </div>

            <div className="slide-counter">
              {currentSlide + 1} / {tutorialSlides.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameLobby;