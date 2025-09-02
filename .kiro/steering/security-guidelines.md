---
inclusion: always
---

# Security Guidelines

## API Key Management
- Never commit API keys to version control
- Use environment variables for all sensitive configuration
- Rotate API keys regularly in production
- Implement proper key validation and error handling
- Consider using key management services for production deployments

## Input Validation and Sanitization
- Validate all user inputs (prompts, guesses, player names)
- Sanitize text inputs to prevent XSS attacks
- Implement proper length limits on all text fields
- Validate room codes and player IDs
- Prevent injection attacks in database queries (if added later)

## Socket.io Security
- Implement proper CORS configuration for production
- Validate all socket events and payloads
- Implement rate limiting to prevent spam
- Use proper authentication for room access if needed
- Monitor and log suspicious connection patterns

## Content Moderation
- Consider implementing content filtering for prompts
- Monitor generated images for inappropriate content
- Implement reporting mechanisms for problematic content
- Have clear community guidelines and enforcement policies
- Consider using OpenAI's content policy compliance tools

## Data Privacy
- Minimize data collection and storage
- Implement proper session management
- Clear game data after sessions end
- Comply with relevant privacy regulations (GDPR, CCPA)
- Provide clear privacy policy and terms of service

## Production Security
- Use HTTPS in production environments
- Implement proper logging and monitoring
- Regular security audits and dependency updates
- Use security headers (helmet.js for Express)
- Implement proper error handling that doesn't leak sensitive information