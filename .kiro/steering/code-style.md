---
inclusion: always
---

# Code Style Guidelines

## JavaScript/Node.js Standards
- Use ES6+ features (const/let, arrow functions, destructuring)
- Prefer async/await over Promise chains
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Handle errors gracefully with try/catch blocks
- Use semicolons consistently

## React Best Practices
- Use functional components with hooks
- Keep components small and focused (single responsibility)
- Use proper prop validation when needed
- Implement proper error boundaries for production
- Use meaningful component and file names
- Extract reusable logic into custom hooks

## File Organization
- Group related files in directories
- Use consistent naming conventions (camelCase for JS, PascalCase for components)
- Keep configuration files in root or dedicated config directories
- Separate business logic from UI components

## Performance Considerations
- Minimize re-renders with proper dependency arrays
- Use React.memo for expensive components when appropriate
- Implement proper cleanup in useEffect hooks
- Optimize socket event listeners to prevent memory leaks