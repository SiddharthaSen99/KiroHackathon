---
inclusion: fileMatch
fileMatchPattern: 'server/**/*.js'
---

# Node.js Server Development Patterns

## Socket.io Architecture Patterns

### Event-Driven Architecture
```javascript
// Implement proper event handling with error boundaries
socket.on('game_action', async (data) => {
  try {
    const result = await handleGameAction(data);
    socket.emit('action_success', result);
  } catch (error) {
    console.error('Game action failed:', error);
    socket.emit('action_error', { message: error.message });
  }
});
```

### Room Management Patterns
- Use Map() for O(1) room lookups instead of arrays
- Implement proper cleanup for disconnected players
- Use room namespaces for different game types
- Implement room capacity limits and validation

### Connection Lifecycle Management
```javascript
// Proper connection handling with cleanup
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('disconnect', (reason) => {
    console.log('User disconnected:', socket.id, reason);
    cleanupPlayerFromAllRooms(socket.id);
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});
```

## AI Service Integration Patterns

### Provider Abstraction Layer
```javascript
class AIServiceProvider {
  constructor(providerName, config) {
    this.provider = providerName;
    this.config = config;
    this.rateLimiter = new RateLimiter(config.rateLimit);
  }
  
  async generateImage(prompt) {
    await this.rateLimiter.checkLimit();
    
    try {
      return await this.callProvider(prompt);
    } catch (error) {
      throw new AIServiceError(`${this.provider} failed: ${error.message}`);
    }
  }
}
```

### Fallback and Retry Patterns
- Implement exponential backoff for API failures
- Use circuit breaker pattern for unreliable services
- Implement graceful degradation when AI services fail
- Cache successful responses to reduce API calls

### Cost Optimization Strategies
```javascript
// Intelligent provider selection based on cost/quality
const selectOptimalProvider = (prompt, qualityRequirement) => {
  const providers = getAvailableProviders();
  
  return providers
    .filter(p => p.quality >= qualityRequirement)
    .sort((a, b) => a.costPerRequest - b.costPerRequest)[0];
};
```

## Game State Management Patterns

### Immutable State Updates
```javascript
// Use immutable patterns for game state
const updateGameState = (currentState, action) => {
  switch (action.type) {
    case 'PLAYER_JOIN':
      return {
        ...currentState,
        players: [...currentState.players, action.player]
      };
    case 'ROUND_START':
      return {
        ...currentState,
        currentRound: currentState.currentRound + 1,
        gameState: 'playing'
      };
    default:
      return currentState;
  }
};
```

### State Validation Patterns
- Validate all state transitions on the server
- Implement state machine patterns for game flow
- Use JSON Schema for payload validation
- Implement anti-cheat measures through server-side validation

## Error Handling and Logging

### Structured Logging
```javascript
const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },
  error: (message, error, meta = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error.stack,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  }
};
```

### Error Classification
- Distinguish between user errors and system errors
- Implement proper HTTP status codes
- Use custom error classes for different error types
- Implement error recovery strategies

## Performance Optimization Patterns

### Memory Management
```javascript
// Proper cleanup of game rooms and timers
class GameRoom {
  constructor(id) {
    this.id = id;
    this.timers = new Set();
  }
  
  addTimer(timer) {
    this.timers.add(timer);
  }
  
  cleanup() {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    
    // Clear references
    this.players = null;
    this.gameState = null;
  }
}
```

### Caching Strategies
- Implement Redis for distributed caching (future)
- Use in-memory caching for frequently accessed data
- Implement cache invalidation strategies
- Cache AI-generated images to reduce costs

### Database Patterns (Future Implementation)
```javascript
// Connection pooling and query optimization
const db = {
  pool: createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10
  }),
  
  async query(sql, params) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(sql, params);
      return rows;
    } finally {
      connection.release();
    }
  }
};
```

## Security Patterns

### Input Validation
```javascript
const validateGameAction = (action) => {
  const schema = {
    type: 'object',
    properties: {
      roomId: { type: 'string', pattern: '^[A-Z0-9]{6}$' },
      action: { type: 'string', enum: ['join', 'leave', 'guess', 'prompt'] },
      payload: { type: 'object' }
    },
    required: ['roomId', 'action']
  };
  
  return ajv.validate(schema, action);
};
```

### Rate Limiting
- Implement per-user rate limiting
- Use sliding window rate limiting
- Implement different limits for different actions
- Add rate limiting for AI API calls

### Authentication Patterns (Future)
```javascript
// JWT-based authentication middleware
const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
};
```

## Monitoring and Observability

### Health Checks
```javascript
// Comprehensive health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    activeRooms: rooms.size,
    activePlayers: getTotalActivePlayers(),
    aiProviders: await checkAIProviderHealth()
  };
  
  res.json(health);
});
```

### Metrics Collection
- Track response times for all endpoints
- Monitor memory usage and garbage collection
- Track AI API usage and costs
- Monitor socket connection counts and patterns