---
inclusion: always
---

# Testing Strategy

## Unit Testing Priorities
- Test game logic and scoring algorithms thoroughly
- Mock external API calls (OpenAI) for consistent testing
- Test edge cases in similarity calculations
- Validate input sanitization and word counting
- Test room management and player state transitions

## Integration Testing
- Test socket.io communication between client and server
- Verify real-time game state synchronization
- Test multiplayer scenarios with multiple clients
- Validate API integration with proper error handling
- Test complete game flow from start to finish

## Manual Testing Scenarios
- Test with various prompt types and complexities
- Verify scoring accuracy with known prompt/guess pairs
- Test network disconnection and reconnection scenarios
- Validate mobile responsiveness and touch interactions
- Test with different numbers of players (2-8)

## Performance Testing
- Load testing with multiple concurrent games
- API response time monitoring
- Memory leak detection in long-running games
- Socket connection stability under load

## Testing Tools and Setup
- Use Jest for unit testing
- Consider Playwright or Cypress for E2E testing
- Mock OpenAI API responses for consistent testing
- Use socket.io-client for testing real-time features
- Implement proper test data factories for game states

## Continuous Integration
- Run tests on every commit
- Include linting and code formatting checks
- Test against multiple Node.js versions
- Automated deployment testing in staging environment