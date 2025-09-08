# AI Prompt Guesser Game - Architecture Spec

## Overview
This spec documents the complete architecture of the AI Prompt Guesser multiplayer game, showcasing real-time communication, AI integration, and scalable design patterns.

## Core Components

### Frontend Architecture
- **React 18** with functional components and hooks
- **Socket.io Client** for real-time multiplayer communication
- **Custom Analytics** integration with Google Analytics 4
- **Sound Management** system for enhanced UX
- **Responsive Design** supporting mobile and desktop

### Backend Architecture
- **Node.js/Express** server with Socket.io
- **Multi-provider AI Integration** (OpenAI, Replicate, Together.ai, Fal.ai)
- **Real-time Game State Management** with room-based architecture
- **Advanced Scoring Algorithm** with string similarity and semantic analysis
- **Cost Tracking** and analytics for AI API usage

### Key Features

#### Multiplayer Game Flow
1. **Room Creation/Joining** - 6-character room codes
2. **Turn-based Gameplay** - Rotating prompt givers
3. **AI Image Generation** - Smart prompt enhancement
4. **Real-time Guessing** - Live scoring and feedback
5. **Spectator Mode** - Watch games in progress

#### AI Integration Strategy
- **Provider Abstraction** - Seamless switching between AI services
- **Cost Optimization** - Automatic provider selection based on cost/quality
- **Fallback System** - Graceful degradation when services fail
- **Smart Prompting** - Enhanced prompts for better image generation

#### Scoring System
- **String Similarity** - Levenshtein distance and word overlap
- **Semantic Analysis** - Optional embedding-based scoring
- **Dynamic Point Calculation** - Rewards creativity and accuracy
- **Prompt Giver Incentives** - Bonus points for challenging prompts

## Technical Implementation

### Real-time Communication
```javascript
// Socket.io event handling with proper cleanup
useEffect(() => {
  socket.on('room_update', handleRoomUpdate);
  socket.on('game_started', handleGameStart);
  
  return () => {
    socket.off('room_update');
    socket.off('game_started');
  };
}, []);
```

### AI Provider Management
```javascript
// Multi-provider architecture with cost optimization
class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'replicate';
    this.initializeProvider();
  }
  
  async generateImage(prompt) {
    const enhancedPrompt = this.createSmartPrompt(prompt);
    return await this.generateWithProvider(enhancedPrompt);
  }
}
```

### Game State Management
```javascript
// Room-based game state with turn rotation
class GameRoom {
  constructor(id) {
    this.players = new Map();
    this.currentRound = 0;
    this.playerOrder = [];
    this.gameState = 'waiting';
  }
  
  nextTurn() {
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.playerOrder.length;
    this.updateGameState();
  }
}
```

## Deployment Strategy

### Production Environment
- **Railway Deployment** with automatic builds
- **Environment Configuration** for different AI providers
- **Analytics Integration** for usage tracking
- **Error Monitoring** and logging

### Performance Optimizations
- **Image Caching** to reduce API costs
- **Connection Pooling** for database operations
- **Gzip Compression** for faster loading
- **CDN Integration** for static assets

## Security Considerations

### API Key Management
- Environment variables for all sensitive data
- Separate configurations for development/production
- Rate limiting to prevent abuse
- Input validation and sanitization

### Game Integrity
- Server-side validation of all game actions
- Anti-cheat measures for scoring
- Room access controls
- Spectator permission management

## Analytics and Monitoring

### User Behavior Tracking
- Game completion rates
- Average session duration
- Popular prompt categories
- Player engagement metrics

### Performance Monitoring
- API response times
- Error rates and types
- Resource usage patterns
- Cost optimization metrics

## Future Enhancements

### Planned Features
- **Custom Room Settings** - Configurable rounds, time limits
- **Tournament Mode** - Bracket-style competitions
- **AI Model Selection** - Player choice of image generation style
- **Social Features** - Friend lists, leaderboards
- **Mobile App** - Native iOS/Android applications

### Technical Improvements
- **Database Integration** - Persistent game history
- **Microservices Architecture** - Scalable service separation
- **Advanced AI Features** - Custom model fine-tuning
- **Real-time Voice Chat** - Enhanced social interaction

## References
- #[[file:server/index.js]] - Main server implementation
- #[[file:client/src/App.js]] - Frontend application entry
- #[[file:server/aiService.js]] - AI integration layer
- #[[file:DEPLOYMENT.md]] - Deployment documentation