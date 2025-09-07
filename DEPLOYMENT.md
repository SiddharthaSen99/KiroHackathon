# 🚀 Deployment Guide for Impromptu

## Option 1: Railway (Recommended for Beginners)

### Step 1: Prepare Your Code
1. Make sure all changes are committed to Git
2. Push your code to GitHub

### Step 2: Deploy on Railway
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-detect it's a Node.js app

### Step 3: Configure Environment Variables
In Railway dashboard:
1. Go to your project → Variables tab
2. Add these variables:
   - `NODE_ENV` = `production`
   - `AI_PROVIDER` = `together`
   - `TOGETHER_API_KEY` = `your_actual_api_key`
   - `PORT` = `5000`

### Step 4: Configure Domain
1. In Railway dashboard, go to Settings → Domains
2. Add your custom domain: `imprompt.to`
3. Follow Railway's instructions to configure DNS

## Option 2: Render

### Step 1: Deploy on Render
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repository

### Step 2: Configure Build Settings
- **Build Command**: `npm run heroku-postbuild`
- **Start Command**: `npm start`
- **Environment**: `Node`

### Step 3: Environment Variables
Add the same variables as Railway above.

### Step 4: Custom Domain
1. In Render dashboard, go to Settings → Custom Domains
2. Add `imprompt.to`
3. Configure DNS as instructed

## DNS Configuration (For Your Domain)

### If using Cloudflare:
1. Go to your Cloudflare dashboard
2. Add these DNS records:
   - Type: `CNAME`, Name: `@`, Content: `your-app-name.railway.app` (or render URL)
   - Type: `CNAME`, Name: `www`, Content: `your-app-name.railway.app`

### If using other DNS providers:
1. Add A record pointing to the IP provided by your hosting service
2. Add CNAME record for www subdomain

## Testing Your Deployment

1. Visit `https://imprompt.to`
2. Create a room and test with multiple browser tabs
3. Share the room code with friends to test multiplayer

## Troubleshooting

### Common Issues:
1. **CORS errors**: Check that your domain is in the CORS configuration
2. **Socket.io connection fails**: Ensure WebSocket support is enabled
3. **Environment variables**: Double-check all API keys are set correctly
4. **Build fails**: Check that all dependencies are in package.json

### Monitoring:
- Check your hosting platform's logs for errors
- Monitor API usage and costs
- Set up alerts for downtime

## Cost Optimization

- Together.ai: ~$0.008 per image (recommended)
- Monitor usage in your hosting dashboard
- Consider implementing rate limiting for heavy usage