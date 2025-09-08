# AI Prompt Guesser Game

A multiplayer web game where players take turns creating prompts for AI image generation, and others guess the original prompt. Think Pictionary meets AI!

## Features

- **Real-time Multiplayer**: Play with friends using room codes
- **AI Image Generation**: Uses OpenAI's DALL-E to create images from prompts
- **Smart Scoring**: Points based on similarity to original prompt
- **Word Limits**: Prompts limited to 5 words for balanced gameplay
- **Round-based**: Multiple rounds with rotating prompt givers
- **Responsive Design**: Works on desktop and mobile

## How to Play

1. **Join a Room**: Enter your name and a room code (or generate one)
2. **Create Prompts**: When it's your turn, write a prompt (max 5 words)
3. **AI Generates**: The AI creates an image from your prompt
4. **Guess Away**: Other players try to guess your original prompt
5. **Score Points**: Get points based on how close your guess is to the original
6. **Rotate Turns**: Everyone gets a chance to be the prompt giver

## Setup

### Prerequisites
- Node.js (v16 or higher)
- OpenAI API key

### Installation

1. **Clone and install dependencies:**
```bash
npm run install-all
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```
Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=your_actual_api_key_here
```

3. **Start the development servers:**
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- React frontend on http://localhost:3000

## Game Configuration

You can modify game settings in `server/index.js`:

```javascript
const GAME_CONFIG = {
  ROUND_TIME: 60,        // seconds per round
  MAX_PROMPT_WORDS: 5,   // word limit for prompts
  POINTS_FOR_EXACT_MATCH: 100,
  POINTS_FOR_CLOSE_MATCH: 50
};
```

## Scoring System

The game uses multiple similarity metrics:
- **Exact Match**: 100 points
- **High Similarity** (80%+): 80 points  
- **Good Similarity** (60%+): 60 points
- **Moderate Similarity** (40%+): 40 points
- **Low Similarity** (20%+): 20 points

Similarity is calculated using:
- String similarity comparison
- Word overlap analysis
- Optional: Semantic similarity using OpenAI embeddings

## Tips for Good Prompts

- Be descriptive but concise
- Include objects, colors, or settings
- Avoid overly abstract concepts
- Think about what would be fun to guess!

## Technology Stack

- **Frontend**: React, Socket.io Client
- **Backend**: Node.js, Express, Socket.io
- **AI**: Together.ai (primary), Fal.ai, Replicate (fallbacks)
- **Similarity**: String similarity + word overlap analysis

## Documentation

### Requirements & Specifications
- **[Formal Requirements](.kiro/specs/multiplayer-prompt-guessing-game/requirements.md)**: Detailed user stories and acceptance criteria
- **[Game Architecture](.kiro/specs/game-architecture.md)**: System design and architecture decisions
- **[AI Integration Strategy](.kiro/specs/ai-integration-strategy.md)**: AI provider integration and cost optimization

### Setup & Deployment
- **[Provider Setup](docs/setup/SETUP_PROVIDERS.md)**: AI provider configuration guide
- **[Deployment Guide](docs/deployment/DEPLOYMENT.md)**: Production deployment instructions
- **[Analytics Setup](docs/setup/ANALYTICS_SETUP.md)**: Analytics and monitoring configuration

### Development
- **[Repository Structure](docs/REPOSITORY_STRUCTURE.md)**: Project organization and file structure
- **[Development Guidelines](.kiro/steering/)**: Code patterns and best practices

## Contributing

Feel free to submit issues and pull requests! Check the [formal requirements](.kiro/specs/multiplayer-prompt-guessing-game/requirements.md) for detailed specifications.

**Enhancement Ideas:**
- Add different AI models and providers
- Implement categories/themes for prompts
- Enhanced spectator features
- Tournament brackets and competitive modes
- Chat functionality and social features
- User accounts and persistent statistics

## License

MIT License - feel free to use this for your own projects!