// Simple Google Analytics 4 integration
class Analytics {
  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production';
    this.gaId = 'G-3Q6C4N0353';
    
    // GA is already loaded via HTML script tag, just need to configure privacy settings
    if (this.isEnabled && window.gtag) {
      this.configurePrivacy();
    }
  }

  configurePrivacy() {
    // Configure privacy-friendly settings
    window.gtag('config', this.gaId, {
      // Privacy-friendly settings
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
  }

  // Track game events
  trackGameStart(playerCount, roomId) {
    if (!this.isEnabled) return;
    
    window.gtag?.('event', 'game_start', {
      event_category: 'game',
      player_count: playerCount,
      room_id: roomId.substring(0, 2) // Only first 2 chars for privacy
    });
  }

  trackGameEnd(playerCount, rounds, duration) {
    if (!this.isEnabled) return;
    
    window.gtag?.('event', 'game_complete', {
      event_category: 'game',
      player_count: playerCount,
      rounds_played: rounds,
      game_duration: Math.round(duration / 1000) // seconds
    });
  }

  trackRoomJoin(playerCount) {
    if (!this.isEnabled) return;
    
    window.gtag?.('event', 'room_join', {
      event_category: 'engagement',
      player_count: playerCount
    });
  }

  trackPromptSubmit() {
    if (!this.isEnabled) return;
    
    window.gtag?.('event', 'prompt_submit', {
      event_category: 'engagement'
    });
  }

  trackGuessSubmit(similarity) {
    if (!this.isEnabled) return;
    
    window.gtag?.('event', 'guess_submit', {
      event_category: 'engagement',
      guess_quality: similarity > 70 ? 'good' : similarity > 40 ? 'fair' : 'poor'
    });
  }

  // Track page views
  trackPageView(pageName) {
    if (!this.isEnabled) return;
    
    window.gtag?.('event', 'page_view', {
      page_title: pageName
    });
  }
}

export default new Analytics();