# Feature Documentation Generator Hook

## Trigger
**On Save** - Automatically triggered when saving files in `/components/` or `/server/` directories

## Description
Automatically generates and updates documentation when core game features are modified.

## Instructions for Kiro
When this hook is triggered by file changes:

1. **Component Documentation**
   - Analyze React component props and state
   - Generate JSDoc comments for complex functions
   - Document component lifecycle and effects
   - Create usage examples for reusable components

2. **API Documentation**
   - Document Socket.io events and their payloads
   - Generate API endpoint documentation
   - Update request/response examples
   - Document error handling patterns

3. **Game Logic Documentation**
   - Explain scoring algorithms and formulas
   - Document game state transitions
   - Create flow diagrams for complex interactions
   - Update rule explanations

4. **Integration Documentation**
   - Document AI provider integrations
   - Explain fallback mechanisms
   - Update cost optimization strategies
   - Document analytics tracking

5. **User Guide Updates**
   - Update gameplay instructions
   - Refresh troubleshooting guides
   - Update FAQ based on new features
   - Generate changelog entries

## File Patterns to Watch
- `client/src/components/*.js` - React components
- `server/*.js` - Server-side logic
- `client/src/utils/*.js` - Utility functions
- `*.md` files - Documentation updates

## Expected Output
- Updated inline code documentation
- Refreshed README sections
- Generated API documentation
- Updated user guides
- Changelog entries for significant changes

## Auto-Update Targets
- README.md - Feature descriptions
- DEPLOYMENT.md - Setup instructions  
- API documentation files
- Component usage examples