# Deployment Preparation Hook

## Trigger
**Manual** - Run before deploying to production

## Description
Comprehensive pre-deployment checklist and preparation tasks to ensure smooth production deployment.

## Instructions for Kiro
When this hook is triggered:

1. **Environment Configuration**
   - Verify all required environment variables are documented in .env.example
   - Check that production URLs are correctly configured
   - Ensure API keys are properly set up for production services
   - Validate CORS settings for production domains

2. **Build Optimization**
   - Verify React build process works correctly
   - Check bundle size and optimization
   - Ensure all assets are properly referenced
   - Test production build locally

3. **Database & Storage**
   - Verify database connections (if applicable)
   - Check data migration scripts
   - Ensure backup procedures are in place
   - Validate data persistence requirements

4. **Security Checklist**
   - Ensure no development secrets in production
   - Verify HTTPS configuration
   - Check rate limiting settings
   - Review authentication mechanisms

5. **Performance Validation**
   - Test with realistic user loads
   - Verify caching strategies
   - Check CDN configuration
   - Validate API response times

6. **Monitoring Setup**
   - Ensure error tracking is configured
   - Verify analytics are working
   - Check logging levels are appropriate
   - Validate health check endpoints

7. **Rollback Plan**
   - Document rollback procedures
   - Ensure previous version can be restored
   - Verify database rollback capabilities
   - Test emergency procedures

## Expected Output
Generate a deployment checklist with:
- ✅/❌ status for each check
- Specific issues that need attention
- Step-by-step deployment instructions
- Rollback procedures
- Post-deployment verification steps