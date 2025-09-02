---
inclusion: always
---

# AI Prompt Guesser Game - Project Context

## Project Overview
This is a multiplayer web-based game inspired by Pictionary, but with an AI twist. Players take turns creating text prompts, AI generates images from those prompts, and other players guess the original prompt.

## Technology Stack
- **Frontend**: React 18 with Socket.io Client for real-time communication
- **Backend**: Node.js with Express and Socket.io for multiplayer functionality  
- **AI Integration**: OpenAI DALL-E 3 API for image generation
- **Scoring**: String similarity algorithms with optional semantic embeddings
- **Styling**: Custom CSS with responsive design

## Key Game Mechanics
- **Room-based multiplayer**: Players join rooms with 6-character codes
- **Turn rotation**: Each player gets to be the prompt giver
- **Word limits**: Prompts limited to 5 words maximum
- **Timed rounds**: 60 seconds per guessing phase
- **Smart scoring**: Points awarded based on similarity to original prompt (20-100 points)
- **Multiple rounds**: Default 5 rounds per game

## File Structure
```
├── server/
│   ├── index.js          # Main server with Socket.io handling
│   └── aiService.js      # OpenAI integration and scoring logic
├── client/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── App.js       # Main React app
│   │   └── App.css      # Styling
│   └── public/          # Static assets
└── package.json         # Dependencies and scripts
```

## Development Workflow
- Use `npm run dev` to start both server and client in development
- Server runs on port 5000, client on port 3000
- Hot reloading enabled for both frontend and backend
- Environment variables managed through .env file

## Deployment Considerations
- Requires OpenAI API key for image generation
- Socket.io needs proper CORS configuration for production
- Consider image caching to reduce API costs
- Monitor API usage and implement rate limiting