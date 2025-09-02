# AI Provider Setup Guide

## Cost Comparison (per 1024x1024 image)

| Provider | Cost per Image | Quality | Speed | Setup Difficulty |
|----------|---------------|---------|-------|------------------|
| **Google Gemini** | ~$0.010 | Excellent | Fast | Easy |
| **Together.ai** | ~$0.008 | Excellent | Fast | Easy |
| **Replicate** | ~$0.0023 | Excellent | Slower | Easy |
| **Fal.ai** | ~$0.055 | Excellent | Very Fast | Easy |
| **OpenAI DALL-E** | ~$0.040 | Excellent | Fast | Easy |

## Recommended Setup: Google Gemini (Best Overall)

### 1. Get Google AI Studio API Key
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

### 2. Configure Environment
```bash
# In your .env file
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Test the Setup
```bash
npm install
npm run server
```

## Alternative: Together.ai (Slightly Cheaper)

### 1. Sign up for Together.ai
1. Go to https://api.together.xyz/
2. Create an account
3. Navigate to API Keys section
4. Create a new API key

### 2. Configure Environment
```bash
# In your .env file
AI_PROVIDER=together
TOGETHER_API_KEY=your_together_api_key_here
```

## Alternative: Replicate (Cheapest Option)

### 1. Sign up for Replicate
1. Go to https://replicate.com/
2. Create an account  
3. Go to Account Settings > API Tokens
4. Create a new token

### 2. Configure Environment
```bash
# In your .env file
AI_PROVIDER=replicate
REPLICATE_API_TOKEN=your_replicate_token_here
```

**Note**: Replicate is cheapest but can be slower due to cold starts.

## Alternative: Fal.ai (Fastest Option)

### 1. Sign up for Fal.ai
1. Go to https://fal.ai/
2. Create an account
3. Navigate to API Keys
4. Generate a new key

### 2. Configure Environment
```bash
# In your .env file
AI_PROVIDER=fal
FAL_API_KEY=your_fal_api_key_here
```

## Cost Monitoring

Monitor your usage at: `http://localhost:5000/api/costs`

Example response:
```json
{
  "totalImages": 150,
  "totalCost": "1.2000",
  "breakdown": [
    {
      "provider": "together",
      "images": 150,
      "cost": "1.2000",
      "percentage": "100.0"
    }
  ]
}
```

## Switching Providers

You can switch providers anytime by changing the `AI_PROVIDER` environment variable:

```bash
# Switch to different provider
AI_PROVIDER=replicate  # or together, fal, openai
```

Restart your server after changing providers.

## Free Tier Information

- **Google Gemini**: $15 free credits monthly (generous free tier!)
- **Together.ai**: $25 free credits
- **Replicate**: $10 free credits  
- **Fal.ai**: $10 free credits
- **OpenAI**: $5 free credits (new accounts)

## Estimated Usage Costs

For a typical game session (10 players, 5 rounds = 50 images):

- **Google Gemini**: $0.50 (often free with monthly credits!)
- **Together.ai**: $0.40
- **Replicate**: $0.12
- **Fal.ai**: $2.75
- **OpenAI**: $2.00

**Recommendation**: Start with Google Gemini for excellent quality, good speed, and generous free tier!