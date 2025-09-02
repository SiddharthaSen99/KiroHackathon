import React, { useState } from 'react';

function GameImage({ imageUrl }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="game-image-container">
      <h3>Guess the prompt that created this image:</h3>
      
      <div className="image-wrapper">
        {!imageLoaded && !imageError && (
          <div className="image-loading">
            <div className="loading-spinner"></div>
            <p>Loading image...</p>
          </div>
        )}
        
        {imageError && (
          <div className="image-error">
            <p>Failed to load image</p>
          </div>
        )}
        
        <img
          src={imageUrl}
          alt="AI Generated"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ display: imageLoaded ? 'block' : 'none' }}
          className="game-image"
        />
      </div>
    </div>
  );
}

export default GameImage;