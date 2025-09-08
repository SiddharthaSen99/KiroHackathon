---
inclusion: manual
---

# Deployment Best Practices

## Railway Deployment Strategy

### Environment Configuration
```bash
# Production environment variables
NODE_ENV=production
PORT=5000
AI_PROVIDER=replicate
REPLICATE_API_TOKEN=your_token_here
TOGETHER_API_KEY=your_key_here
```

### Build Optimization
- Use multi-stage Docker builds for smaller images
- Implement proper caching layers
- Optimize bundle sizes with webpack analysis
- Use production-ready React builds

### Health Monitoring
```javascript
// Comprehensive health check
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    activeConnections: io.engine.clientsCount,
    aiProviderStatus: checkAIProviders()
  };
  
  res.json(health);
});
```

## Security Hardening

### API Key Protection
- Never commit API keys to version control
- Use Railway's environment variable management
- Implement key rotation strategies
- Monitor for key exposure in logs

### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

### CORS Configuration
```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://imprompt.to', 'https://www.imprompt.to']
    : 'http://localhost:3000',
  credentials: true
};

app.use(cors(corsOptions));
```

## Performance Optimization

### Caching Strategy
- Implement Redis for session storage (future)
- Use CDN for static assets
- Cache AI-generated images
- Implement proper HTTP caching headers

### Database Optimization (Future)
```javascript
// Connection pooling configuration
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  acquireTimeout: 60000,
  timeout: 60000
});
```

### Memory Management
- Monitor memory usage patterns
- Implement proper garbage collection
- Clean up disconnected socket connections
- Remove expired game rooms

## Monitoring and Alerting

### Error Tracking
```javascript
// Structured error logging
const logError = (error, context = {}) => {
  console.error(JSON.stringify({
    level: 'error',
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  }));
};
```

### Performance Metrics
- Track response times for all endpoints
- Monitor socket connection counts
- Track AI API usage and costs
- Monitor memory and CPU usage

### Alerting Thresholds
- High error rates (>5% in 5 minutes)
- Memory usage >80%
- AI API failures >10% in 10 minutes
- Response times >2 seconds

## Backup and Recovery

### Data Backup Strategy
- Regular backups of game analytics data
- Configuration backup procedures
- API key backup and recovery
- Database backup automation (future)

### Disaster Recovery
```javascript
// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  server.close(() => {
    console.log('HTTP server closed');
    
    // Close database connections
    if (db) {
      db.end(() => {
        console.log('Database connections closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
});
```

## Scaling Considerations

### Horizontal Scaling
- Use Redis for session sharing across instances
- Implement sticky sessions for socket connections
- Use load balancer with proper health checks
- Consider microservices architecture for future growth

### Vertical Scaling
- Monitor resource usage patterns
- Optimize memory allocation
- Use clustering for CPU-intensive tasks
- Implement proper connection pooling

## Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Build process tested locally
- [ ] Security scan completed
- [ ] Performance testing completed
- [ ] Backup procedures verified

### Deployment Process
- [ ] Deploy to staging environment first
- [ ] Run smoke tests
- [ ] Monitor error rates
- [ ] Verify all integrations working
- [ ] Update DNS if needed

### Post-Deployment
- [ ] Monitor application health
- [ ] Check error logs
- [ ] Verify analytics tracking
- [ ] Test critical user flows
- [ ] Update documentation

## Rollback Procedures

### Automated Rollback Triggers
- Error rate >10% for 5 minutes
- Response time >5 seconds for 3 minutes
- Health check failures for 2 minutes
- Critical security vulnerability detected

### Manual Rollback Process
1. Identify the issue and impact
2. Communicate with stakeholders
3. Execute rollback to previous version
4. Verify system stability
5. Investigate root cause
6. Plan fix and re-deployment