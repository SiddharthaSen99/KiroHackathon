# Cheap AI Image Generation Setup

## Current Status: Switched to Replicate (10x cheaper!)

### Cost Comparison:
- **Together.ai**: ~$0.008/image (FLUX model)
- **Replicate**: ~$0.0023/image (SDXL model) ⭐ **CHEAPEST**
- **Fal.ai**: ~$0.055/image
- **OpenAI DALL-E**: ~$0.04/image

## Quick Setup for Replicate (Recommended)

### 1. Get Replicate API Token
1. Go to https://replicate.com
2. Sign up/login
3. Go to Account Settings → API Tokens
4. Create a new token
5. Copy the token

### 2. Update Your .env File
```bash
AI_PROVIDER=replicate
REPLICATE_API_TOKEN=r8_your_actual_token_here
```

### 3. Test It
Your game is already configured! Just restart the server:
```bash
npm run dev
```

## Alternative Cheap Options

### Option 2: Hugging Face (Ultra Cheap - $0.000032/image)
```bash
AI_PROVIDER=huggingface
HUGGINGFACE_API_KEY=your_hf_token
```

### Option 3: Fal.ai (Good Speed/Cost Balance)
```bash
AI_PROVIDER=fal
FAL_API_KEY=your_fal_key
```

### Option 4: Mock Mode (Free for Testing)
```bash
AI_PROVIDER=mock
```

## Current Configuration
- ✅ Replicate package installed
- ✅ Code already supports Replicate
- ✅ Using SDXL model (great quality)
- ✅ 1024x1024 resolution
- ⏳ Just need your API token

## Expected Costs (1000 images)
- **Replicate**: ~$2.30
- **Together.ai**: ~$8.00
- **Fal.ai**: ~$55.00
- **OpenAI**: ~$40.00

**Replicate saves you ~70% compared to Together.ai!**