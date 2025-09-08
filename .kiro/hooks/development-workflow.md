# Development Workflow Optimization Hook

## Trigger
**On Save** - Automatically triggered when saving any `.js`, `.jsx`, `.md`, or configuration files

## Description
Comprehensive development workflow optimization that maintains code quality, documentation, and project consistency across the entire codebase.

## Instructions for Kiro
When this hook is triggered by file changes:

### 1. Code Quality Analysis
- **Syntax Validation**: Check for syntax errors and common mistakes
- **Performance Review**: Identify potential performance bottlenecks
- **Security Scan**: Look for security vulnerabilities or exposed secrets
- **Best Practices**: Ensure adherence to React and Node.js best practices
- **Dependency Analysis**: Check for outdated or vulnerable dependencies

### 2. Documentation Synchronization
- **API Documentation**: Update Socket.io event documentation when server files change
- **Component Documentation**: Generate/update JSDoc for React components
- **README Updates**: Refresh feature descriptions and setup instructions
- **Changelog Generation**: Create changelog entries for significant changes
- **Architecture Diagrams**: Update system architecture documentation

### 3. Configuration Management
- **Environment Variables**: Ensure all required env vars are documented in .env.example
- **Package Dependencies**: Check for version conflicts and security issues
- **Build Configuration**: Validate webpack, babel, and other build configs
- **Deployment Settings**: Verify Railway and production configurations

### 4. Testing and Validation
- **Component Integration**: Verify React components work with current props/state
- **Socket Event Validation**: Check socket.io event handlers and emitters
- **API Endpoint Testing**: Validate server endpoints and responses
- **Cross-Browser Compatibility**: Check for browser-specific issues
- **Mobile Responsiveness**: Verify mobile-friendly design patterns

### 5. Performance Optimization
- **Bundle Analysis**: Check for unnecessary imports and large dependencies
- **Memory Leak Detection**: Identify potential memory leaks in React components
- **Socket Connection Optimization**: Ensure proper cleanup of socket listeners
- **AI API Efficiency**: Optimize AI service calls and caching strategies
- **Database Query Optimization**: Review database queries for efficiency (future)

### 6. Security Hardening
- **Input Validation**: Ensure all user inputs are properly validated
- **XSS Prevention**: Check for potential XSS vulnerabilities in React components
- **API Security**: Verify proper authentication and authorization
- **Environment Security**: Ensure no secrets are exposed in client code
- **CORS Configuration**: Validate cross-origin resource sharing settings

### 7. Accessibility Compliance
- **ARIA Labels**: Ensure proper accessibility labels on interactive elements
- **Keyboard Navigation**: Verify all functionality is keyboard accessible
- **Screen Reader Support**: Check for proper semantic HTML structure
- **Color Contrast**: Validate color contrast ratios meet WCAG guidelines
- **Focus Management**: Ensure proper focus handling in dynamic content

### 8. Deployment Readiness
- **Build Process**: Verify production build works correctly
- **Environment Configuration**: Check all production environment variables
- **Health Checks**: Ensure health check endpoints are functional
- **Error Handling**: Verify proper error handling and logging
- **Monitoring Setup**: Check analytics and error tracking configuration

## File-Specific Actions

### React Components (`client/src/components/*.js`)
- Validate prop types and default props
- Check for proper useEffect cleanup
- Ensure proper event handler memoization
- Verify accessibility attributes
- Update component documentation

### Server Files (`server/*.js`)
- Validate socket event handlers
- Check for proper error handling
- Verify input validation
- Update API documentation
- Check for security vulnerabilities

### Configuration Files (`*.json`, `*.config.js`)
- Validate JSON syntax
- Check for security misconfigurations
- Verify environment-specific settings
- Update documentation for new configurations

### Documentation Files (`*.md`)
- Check for broken links
- Validate code examples
- Ensure consistent formatting
- Update table of contents
- Verify accuracy of instructions

## Expected Output
Generate a comprehensive report including:

### Code Quality Report
```
✅ Syntax validation passed
⚠️  Performance: Consider memoizing expensive calculations in GameRoom.js:45
❌ Security: Potential XSS vulnerability in GuessInput.js:23
✅ Best practices compliance
```

### Documentation Updates
- Updated API documentation for new socket events
- Refreshed component prop documentation
- Generated changelog entry for new features
- Updated README with new environment variables

### Action Items
- Priority-ranked list of issues to address
- Specific file locations and line numbers
- Suggested fixes with code examples
- Links to relevant documentation or best practices

### Performance Recommendations
- Bundle size optimization suggestions
- Memory usage improvements
- API call optimization opportunities
- Caching strategy recommendations

## Integration with Development Tools
- Automatically format code using Prettier (if configured)
- Run ESLint checks and provide fix suggestions
- Update package.json dependencies when needed
- Generate or update TypeScript definitions (if applicable)

## Continuous Improvement
- Track common issues and suggest preventive measures
- Learn from past fixes to improve future recommendations
- Adapt recommendations based on project evolution
- Provide learning resources for identified skill gaps