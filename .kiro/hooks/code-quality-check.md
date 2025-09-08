# Code Quality Check Hook

## Trigger
**Manual** - Run when you want to perform a comprehensive code quality check

## Description
Performs a thorough code quality analysis including:
- Security vulnerability scanning
- Performance optimization suggestions
- Code style consistency checks
- Documentation completeness review
- Dependency audit

## Instructions for Kiro
When this hook is triggered:

1. **Security Analysis**
   - Scan for hardcoded secrets or API keys
   - Check for potential XSS vulnerabilities in React components
   - Verify proper input validation in server endpoints
   - Review authentication and authorization patterns

2. **Performance Review**
   - Identify unnecessary re-renders in React components
   - Check for memory leaks in socket connections
   - Review database query efficiency (if applicable)
   - Analyze bundle size and loading performance

3. **Code Style & Best Practices**
   - Ensure consistent naming conventions
   - Verify proper error handling patterns
   - Check for unused imports and variables
   - Review component structure and separation of concerns

4. **Documentation Check**
   - Verify all functions have appropriate comments
   - Check README accuracy and completeness
   - Ensure API endpoints are documented
   - Review deployment instructions

5. **Dependency Audit**
   - Check for outdated packages
   - Identify security vulnerabilities in dependencies
   - Suggest performance improvements through package updates
   - Review license compatibility

## Expected Output
Provide a comprehensive report with:
- Priority-ranked list of issues found
- Specific file locations and line numbers
- Suggested fixes with code examples
- Performance improvement recommendations
- Security enhancement suggestions