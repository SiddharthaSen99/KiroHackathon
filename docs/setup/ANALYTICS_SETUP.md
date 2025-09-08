# Analytics Setup Guide

## Overview
The game includes both client-side and server-side analytics to track usage without requiring user authentication.

## What Gets Tracked

### Client-Side (Google Analytics 4)
- **Page Views**: Lobby, Room Created, Game Playing
- **Game Events**: Game starts, room joins, prompt submissions, guesses
- **Player Counts**: How many players per game
- **Game Quality**: Guess accuracy levels

### Server-Side (Console Logs)
- **Game Statistics**: Total games, players, rounds, prompts, guesses
- **Daily Stats**: Games and players per day
- **Room Activity**: Player joins/leaves, room creation
- **Hourly Summaries**: Periodic stats logging

## Setup Instructions

### 1. Google Analytics (Pre-configured)

**Already Set Up!** 
- Google Analytics 4 is already configured with measurement ID: `G-3Q6C4N0353`
- Privacy-friendly settings are pre-configured
- Analytics automatically work in production (`NODE_ENV=production`)
- No additional setup required!

### 2. Railway Analytics

**Built-in Metrics** (Available in Railway Dashboard):
- HTTP requests and response times
- Memory and CPU usage
- Deployment logs and errors
- Basic traffic patterns

**Custom Logs** (View in Railway Logs):
- Search for `[ANALYTICS]` to see game statistics
- Hourly summaries with player counts and game totals
- Daily breakdowns of activity

### 3. View Analytics Data

**Google Analytics Dashboard**:
- Real-time users and events
- Custom events: `game_start`, `room_join`, `prompt_submit`, `guess_submit`
- Player count distributions
- Game completion rates

**Server Analytics Endpoint**:
- Visit: `https://yourdomain.com/api/analytics`
- Shows current stats, active rooms, and historical data
- JSON format for easy integration

**Railway Logs**:
```bash
# View recent analytics logs
railway logs --filter="[ANALYTICS]"
```

## Sample Analytics Data

### Google Analytics Events
```javascript
// Game started with 4 players
gtag('event', 'game_start', {
  event_category: 'game',
  player_count: 4,
  room_id: 'AB**'  // Privacy-safe partial room ID
});

// Good quality guess submitted
gtag('event', 'guess_submit', {
  event_category: 'engagement',
  guess_quality: 'good'  // good/fair/poor
});
```

### Server Logs
```
[ANALYTICS] Game started - Players: 4, Room: AB**, Total games today: 12
[ANALYTICS] Round completed - Players: 4, Guesses: 8, Prompt length: 15
[ANALYTICS HOURLY] 2024-01-15T14:00:00.000Z
Total Games: 45
Total Players: 180
Total Rounds: 225
```

### API Endpoint Response
```json
{
  "totalGames": 45,
  "totalPlayers": 180,
  "totalRounds": 225,
  "totalPrompts": 225,
  "totalGuesses": 1800,
  "activeRooms": 3,
  "totalActivePlayers": 12,
  "dailyStats": {
    "2024-01-15": { "games": 12, "players": 48 },
    "2024-01-14": { "games": 8, "players": 32 }
  }
}
```

## Privacy & Compliance

### Data Collection
- **No Personal Data**: Names are not stored permanently
- **Anonymous IDs**: Room codes are partially masked in logs
- **IP Anonymization**: Google Analytics anonymizes IPs
- **No Cookies**: Analytics works without persistent cookies

### GDPR Compliance
- Minimal data collection
- No user profiles or tracking across sessions
- Clear purpose (game improvement and usage statistics)
- Easy to disable by not setting GA_MEASUREMENT_ID

## Monitoring Tips

1. **Check Daily**: Look at daily player counts and game completion rates
2. **Monitor Errors**: Watch for spikes in failed games or disconnections
3. **Track Engagement**: Monitor average rounds per game and guess quality
4. **Performance**: Use Railway metrics for response times and resource usage

## Troubleshooting

**Analytics Not Working?**
- Ensure `NODE_ENV=production` is set
- Check that `REACT_APP_GA_MEASUREMENT_ID` is correctly formatted
- Verify the measurement ID in Google Analytics

**No Server Logs?**
- Check Railway logs for `[ANALYTICS]` entries
- Ensure games are actually being played (not just rooms created)
- Verify the analytics module is imported correctly

**API Endpoint 404?**
- Ensure server is running and deployed
- Check the endpoint URL: `/api/analytics`
- Verify the route is added to server/index.js