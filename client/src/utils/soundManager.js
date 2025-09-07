class SoundManager {
  constructor() {
    this.sounds = {};
    this.enabled = true;
    this.volume = 0.7;
    this.initializeSounds();
  }

  initializeSounds() {
    // Create audio contexts for different sound effects
    this.sounds = {
      playerJoin: this.createBeepSound(800, 0.1, 'sine'),
      playerReady: this.createBeepSound(600, 0.15, 'square'),
      allReady: this.createChord([523, 659, 784], 0.3), // C major chord
      gameStart: this.createFanfare(),
      promptSubmitted: this.createBeepSound(1000, 0.2, 'triangle'),
      guessSubmitted: this.createBeepSound(400, 0.1, 'sawtooth'),
      roundEnd: this.createSuccessSound(),
      gameEnd: this.createVictoryFanfare(),
      countdown: this.createCountdownSound(),
      roomCreated: this.createRoomCreatedSound()
    };
  }

  createBeepSound(frequency, duration, waveType = 'sine') {
    return () => {
      if (!this.enabled) return;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = waveType;
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    };
  }

  createChord(frequencies, duration) {
    return () => {
      if (!this.enabled) return;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.2, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime + index * 0.05);
        oscillator.stop(audioContext.currentTime + duration + index * 0.05);
      });
    };
  }

  createFanfare() {
    return () => {
      if (!this.enabled) return;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523, 659, 784, 1047]; // C, E, G, C (octave)
      
      notes.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        oscillator.type = 'triangle';
        
        const startTime = audioContext.currentTime + index * 0.15;
        const duration = 0.3;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.4, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      });
    };
  }

  createSuccessSound() {
    return () => {
      if (!this.enabled) return;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [659, 784, 988]; // E, G, B
      
      notes.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        oscillator.type = 'sine';
        
        const startTime = audioContext.currentTime + index * 0.1;
        const duration = 0.4;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      });
    };
  }

  createVictoryFanfare() {
    return () => {
      if (!this.enabled) return;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const melody = [523, 659, 784, 1047, 784, 1047, 1319]; // Victory melody
      
      melody.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        oscillator.type = 'triangle';
        
        const startTime = audioContext.currentTime + index * 0.2;
        const duration = index === melody.length - 1 ? 0.8 : 0.3;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.5, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      });
    };
  }

  createCountdownSound() {
    return (timeRemaining) => {
      if (!this.enabled) return;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different frequencies for different countdown numbers
      let frequency;
      if (timeRemaining === 1) {
        frequency = 1200; // Highest pitch for 1
      } else if (timeRemaining === 2) {
        frequency = 1000; // High pitch for 2
      } else if (timeRemaining === 3) {
        frequency = 800;  // Medium pitch for 3
      } else if (timeRemaining === 4) {
        frequency = 600;  // Lower pitch for 4
      } else {
        frequency = 500;  // Lowest pitch for 5
      }
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'square';
      
      const duration = timeRemaining === 1 ? 0.3 : 0.2; // Longer beep for final second
      const volume = timeRemaining === 1 ? 0.6 : 0.4;   // Louder for final second
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume * volume, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    };
  }

  createRoomCreatedSound() {
    return () => {
      if (!this.enabled) return;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      // Play a celebratory ascending chord progression
      const notes = [523, 659, 784, 1047]; // C, E, G, C (octave) - major chord
      
      notes.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        oscillator.type = 'sine';
        
        const startTime = audioContext.currentTime + index * 0.1;
        const duration = 0.4;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.4, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      });
      
      // Add a final celebratory high note
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(1319, audioContext.currentTime); // High E
        oscillator.type = 'triangle';
        
        const duration = 0.6;
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.5, audioContext.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
      }, 400);
    };
  }

  // Public methods to play sounds
  playPlayerJoin() {
    this.sounds.playerJoin();
  }

  playPlayerReady() {
    this.sounds.playerReady();
  }

  playAllReady() {
    this.sounds.allReady();
  }

  playGameStart() {
    this.sounds.gameStart();
  }

  playPromptSubmitted() {
    this.sounds.promptSubmitted();
  }

  playGuessSubmitted() {
    this.sounds.guessSubmitted();
  }

  playRoundEnd() {
    this.sounds.roundEnd();
  }

  playGameEnd() {
    this.sounds.gameEnd();
  }

  playCountdown(timeRemaining) {
    this.sounds.countdown(timeRemaining);
  }

  playRoomCreated() {
    this.sounds.roomCreated();
  }

  // Settings
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  isEnabled() {
    return this.enabled;
  }
}

// Create a singleton instance
const soundManager = new SoundManager();

export default soundManager;