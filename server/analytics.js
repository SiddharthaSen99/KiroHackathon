// Simple server-side analytics logging
class ServerAnalytics {
  constructor() {
    this.stats = {
      totalGames: 0,
      totalPlayers: 0,
      totalRounds: 0,
      totalPrompts: 0,
      totalGuesses: 0,
      dailyStats: new Map()
    };
    
    // Log stats every hour in production
    if (process.env.NODE_ENV === 'production') {
      setInterval(() => this.logHourlyStats(), 60 * 60 * 1000);
    }
  }

  // Track game events
  trackGameStart(playerCount, roomId) {
    this.stats.totalGames++;
    this.stats.totalPlayers += playerCount;
    
    const today = new Date().toISOString().split('T')[0];
    const dailyStat = this.stats.dailyStats.get(today) || { games: 0, players: 0 };
    dailyStat.games++;
    dailyStat.players += playerCount;
    this.stats.dailyStats.set(today, dailyStat);
    
    console.log(`[ANALYTICS] Game started - Players: ${playerCount}, Room: ${roomId.substring(0, 2)}**, Total games today: ${dailyStat.games}`);
  }

  trackRoundComplete(playerCount, promptLength, guessCount) {
    this.stats.totalRounds++;
    this.stats.totalPrompts++;
    this.stats.totalGuesses += guessCount;
    
    console.log(`[ANALYTICS] Round completed - Players: ${playerCount}, Guesses: ${guessCount}, Prompt length: ${promptLength}`);
  }

  trackPlayerJoin(roomId, playerCount) {
    console.log(`[ANALYTICS] Player joined - Room: ${roomId.substring(0, 2)}**, New count: ${playerCount}`);
  }

  trackPlayerLeave(roomId, playerCount, reason = 'disconnect') {
    console.log(`[ANALYTICS] Player left - Room: ${roomId.substring(0, 2)}**, Remaining: ${playerCount}, Reason: ${reason}`);
  }

  // Log periodic stats
  logHourlyStats() {
    const now = new Date();
    console.log(`[ANALYTICS HOURLY] ${now.toISOString()}`);
    console.log(`Total Games: ${this.stats.totalGames}`);
    console.log(`Total Players: ${this.stats.totalPlayers}`);
    console.log(`Total Rounds: ${this.stats.totalRounds}`);
    console.log(`Total Prompts: ${this.stats.totalPrompts}`);
    console.log(`Total Guesses: ${this.stats.totalGuesses}`);
    
    // Log last 7 days
    const last7Days = Array.from(this.stats.dailyStats.entries())
      .slice(-7)
      .map(([date, stats]) => `${date}: ${stats.games} games, ${stats.players} players`)
      .join(' | ');
    
    console.log(`Last 7 days: ${last7Days}`);
  }

  // Get current stats (for health check endpoint)
  getStats() {
    return {
      ...this.stats,
      dailyStats: Object.fromEntries(this.stats.dailyStats)
    };
  }
}

module.exports = new ServerAnalytics();