---
inclusion: fileMatch
fileMatchPattern: 'client/src/**/*.js'
---

# React Development Patterns

## Component Architecture Patterns

### Custom Hooks for Game Logic
When working with game-related components, extract complex logic into custom hooks:

```javascript
// Example: useGameState hook
const useGameState = (socket, roomId) => {
  const [gameState, setGameState] = useState('lobby');
  const [players, setPlayers] = useState([]);
  
  useEffect(() => {
    const handleGameUpdate = (data) => {
      setGameState(data.gameState);
      setPlayers(data.players);
    };
    
    socket.on('game_update', handleGameUpdate);
    return () => socket.off('game_update', handleGameUpdate);
  }, [socket]);
  
  return { gameState, players };
};
```

### Component Composition Patterns
- Use compound components for complex UI elements (GameRoom + PlayerList + GameBoard)
- Implement render props for flexible component reuse
- Use React.forwardRef for components that need DOM access

### State Management Patterns
- Lift state up only when multiple components need it
- Use useReducer for complex state logic with multiple actions
- Implement optimistic updates for better UX in multiplayer scenarios

## Socket.io Integration Patterns

### Connection Management
```javascript
// Proper socket connection with cleanup
useEffect(() => {
  const socket = io(SERVER_URL);
  
  socket.on('connect', () => {
    console.log('Connected to server');
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });
  
  return () => {
    socket.disconnect();
  };
}, []);
```

### Event Handler Patterns
- Use useCallback for socket event handlers to prevent unnecessary re-renders
- Implement proper error handling for socket events
- Use event namespacing for different game phases

## Performance Optimization Patterns

### Memoization Strategies
```javascript
// Memoize expensive calculations
const gameScore = useMemo(() => {
  return calculateComplexScore(guesses, timeRemaining);
}, [guesses, timeRemaining]);

// Memoize event handlers
const handleGuessSubmit = useCallback((guess) => {
  socket.emit('submit_guess', { roomId, guess });
}, [socket, roomId]);
```

### Component Splitting
- Split large components into smaller, focused components
- Use React.lazy for code splitting on route level
- Implement virtual scrolling for large lists (if needed)

## Error Handling Patterns

### Error Boundaries
Implement error boundaries for graceful error handling:

```javascript
class GameErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Game error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <GameErrorFallback />;
    }
    
    return this.props.children;
  }
}
```

### Async Error Handling
- Use try-catch blocks in async functions
- Implement proper loading and error states
- Provide user-friendly error messages

## Accessibility Patterns

### Keyboard Navigation
- Implement proper tab order for game controls
- Add keyboard shortcuts for common actions
- Ensure all interactive elements are keyboard accessible

### Screen Reader Support
- Use semantic HTML elements
- Implement proper ARIA labels and descriptions
- Provide text alternatives for visual game elements

### Focus Management
- Manage focus during game state transitions
- Implement focus traps for modal dialogs
- Restore focus after closing overlays

## Testing Patterns (When Applicable)

### Component Testing
- Test component behavior, not implementation details
- Mock socket connections for isolated testing
- Use React Testing Library best practices

### Integration Testing
- Test complete user flows
- Mock external API calls
- Test error scenarios and edge cases