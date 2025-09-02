---
inclusion: always
---

# AI Integration Best Practices

## OpenAI API Usage
- Always handle API errors gracefully with user-friendly messages
- Implement proper rate limiting and retry logic
- Use environment variables for API keys (never hardcode)
- Monitor API usage and costs in production
- Consider fallback options for API failures

## Image Generation Guidelines
- **Cost Optimization Priority**: Use Together.ai (SDXL) as primary provider (~$0.008/image)
- **Fallback Options**: Fal.ai (~$0.055/image) or Replicate (~$0.0023/image but slower)
- **Quality vs Cost**: SDXL models provide excellent quality at fraction of DALL-E cost
- 1024x1024 size provides good detail without excessive bandwidth
- Implement proper loading states during generation
- Cache generated images when possible to reduce API calls
- Monitor usage across providers to optimize costs

## Similarity Scoring
- Combine multiple similarity metrics for robust scoring:
  - String similarity (primary)
  - Word overlap analysis
  - Optional: Semantic embeddings for advanced scoring
- Normalize text before comparison (lowercase, remove punctuation)
- Consider synonyms and alternative phrasings
- Provide transparent scoring feedback to players

## Error Handling
- Graceful degradation when AI services are unavailable
- Clear error messages that don't expose technical details
- Retry mechanisms for transient failures
- Fallback scoring methods if advanced AI scoring fails

## Performance Optimization
- Batch API calls when possible
- Implement proper caching strategies
- Use streaming responses for real-time feedback
- Monitor and log API response times