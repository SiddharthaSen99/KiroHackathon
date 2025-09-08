# Repository Structure

## Overview
This document outlines the organized structure of the AI Prompt Guesser repository after the comprehensive cleanup and restructuring.

## Root Directory
```
.
├── .env                    # Environment variables (local)
├── .env.example           # Environment template
├── .gitignore            # Git ignore rules
├── .railwayignore        # Railway ignore rules
├── .dockerignore         # Docker ignore rules
├── Dockerfile            # Container configuration
├── package.json          # Root package configuration
├── package-lock.json     # Dependency lock file
├── README.md             # Main project documentation
├── LICENSE.md            # Project license
└── CONTRIBUTING.md       # Contribution guidelines
```

## Documentation (`docs/`)
```
docs/
├── README.md                           # Documentation index
├── REPOSITORY_STRUCTURE.md             # This file
├── setup/                              # Setup and configuration
│   ├── SETUP_PROVIDERS.md             # AI provider setup
│   ├── ANALYTICS_SETUP.md             # Analytics configuration
│   ├── MCP_SETUP_GUIDE.md             # Kiro MCP server setup
│   └── CHEAP_AI_SETUP.md              # Cost-effective AI setup
├── deployment/                         # Deployment guides
│   ├── DEPLOYMENT.md                  # Production deployment
│   └── DEPLOYMENT_CHECKLIST.md        # Pre-deployment checklist
└── development/                        # Development resources
    └── Changes.md                      # Development changelog
```

## Client Application (`client/`)
```
client/
├── package.json                        # Client dependencies
├── package-lock.json                   # Client dependency lock
├── public/                             # Static assets
│   ├── index.html                     # Main HTML template
│   ├── favicon.svg                    # Site icon
│   ├── favicon-16x16.png             # Small favicon
│   └── favicon-32x32.png             # Medium favicon
└── src/                               # React source code
    ├── index.js                       # React entry point
    ├── App.js                         # Main App component
    ├── App.css                        # Global styles
    ├── index.css                      # Base styles
    ├── components/                    # React components
    │   ├── GameLobby.js              # Main lobby interface
    │   ├── GameRoom.js               # Game room interface
    │   ├── GameImage.js              # AI image display
    │   ├── PlayerList.js             # Player list component
    │   ├── PromptInput.js            # Prompt input form
    │   ├── GuessInput.js             # Guess input form
    │   ├── RoundResults.js           # Round results display
    │   └── RoomCreated.js            # Room creation success
    └── utils/                        # Utility functions
        ├── analytics.js              # Analytics tracking
        └── soundManager.js           # Sound effects
```

## Server Application (`server/`)
```
server/
├── package.json                        # Server dependencies
├── package-lock.json                   # Server dependency lock
├── index.js                           # Main server file
├── aiService.js                       # AI provider integration
├── analytics.js                       # Server-side analytics
└── costTracker.js                     # AI cost tracking
```

## Kiro IDE Configuration (`.kiro/`)
```
.kiro/
├── settings/
│   └── mcp.json                       # MCP server configuration
├── specs/                             # Project specifications
│   ├── game-architecture.md          # System architecture
│   ├── ai-integration-strategy.md    # AI integration details
│   └── kiro-integration-showcase.md  # Kiro features showcase
├── hooks/                             # Development hooks
│   ├── code-quality-check.md         # Code quality automation
│   ├── deployment-prep.md            # Deployment preparation
│   ├── feature-documentation.md      # Auto-documentation
│   └── development-workflow.md       # Workflow optimization
└── steering/                          # Development guidelines
    ├── performance-optimization.md   # Performance best practices
    ├── react-patterns.md             # React development patterns
    ├── nodejs-patterns.md            # Node.js development patterns
    └── deployment-best-practices.md  # Deployment guidelines
```

## Key Benefits of This Structure

### 🗂️ **Organized Documentation**
- All documentation in dedicated `docs/` directory
- Categorized by purpose (setup, deployment, development)
- Easy to navigate and maintain
- Clear separation between user and developer docs

### 🎯 **Clean Root Directory**
- Only essential files in root
- No duplicate documentation files
- Professional appearance for GitHub
- Easy deployment and containerization

### 📚 **Comprehensive Kiro Integration**
- Specs document architecture and decisions
- Hooks automate development workflows
- Steering rules ensure code quality
- MCP servers provide tool integration

### 🚀 **Deployment Ready**
- Clean structure for containerization
- All configuration files properly organized
- Documentation supports production deployment
- Easy to understand for new developers

### 🤝 **Community Friendly**
- Clear contributing guidelines
- Comprehensive documentation
- Professional license and structure
- Easy onboarding for new contributors

## Navigation Tips

- **Getting Started**: Start with [README.md](../README.md)
- **Contributing**: Check [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines
- **Setup**: Use [docs/setup/](setup/) for configuration guides
- **Deployment**: Reference [docs/deployment/](deployment/) for production
- **Development**: Check [docs/development/](development/) for changes
- **Architecture**: Review [.kiro/specs/](../.kiro/specs/) for system design

## File Organization Principles

### **Documentation**
- **Categorized by purpose** (setup, deployment, development)
- **Logical hierarchy** with clear naming
- **Cross-references** between related documents
- **Consistent formatting** and structure

### **Code Structure**
- **Separation of concerns** (client/server/docs)
- **Modular organization** within each directory
- **Clear naming conventions** throughout
- **Scalable architecture** for future growth

### **Configuration**
- **Environment-specific** files properly organized
- **Kiro IDE integration** in dedicated directory
- **Build and deployment** configs in root
- **Security-conscious** file placement

This structure supports both development efficiency and long-term maintainability while showcasing advanced Kiro IDE integration and professional open-source practices.