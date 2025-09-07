# 🚀 Quick Deployment Checklist

## Before You Deploy

- [ ] Code is committed and pushed to GitHub
- [ ] You have your AI API key ready (Together.ai recommended)
- [ ] Domain `imprompt.to` is ready to configure

## Railway Deployment (Easiest)

### 1. Deploy
- [ ] Go to [railway.app](https://railway.app)
- [ ] Sign up with GitHub
- [ ] Click "New Project" → "Deploy from GitHub repo"
- [ ] Select your Impromptu repository

### 2. Environment Variables
In Railway dashboard → Variables:
- [ ] `NODE_ENV` = `production`
- [ ] `AI_PROVIDER` = `together`
- [ ] `TOGETHER_API_KEY` = `your_actual_together_api_key`

### 3. Custom Domain
- [ ] Railway dashboard → Settings → Domains
- [ ] Add custom domain: `imprompt.to`
- [ ] Copy the CNAME target Railway provides

### 4. DNS Configuration
In your domain registrar (where you bought imprompt.to):
- [ ] Add CNAME record: `@` → `your-app.railway.app`
- [ ] Add CNAME record: `www` → `your-app.railway.app`
- [ ] Wait 5-30 minutes for DNS propagation

### 5. Test
- [ ] Visit `https://imprompt.to`
- [ ] Create a room
- [ ] Test with multiple browser tabs/devices
- [ ] Share with friends to test multiplayer

## 🎉 You're Live!

Your game should now be accessible at `https://imprompt.to`

## Need Help?
- Check Railway logs if something isn't working
- Verify all environment variables are set
- Make sure DNS records are correct
- Test the health endpoint: `https://imprompt.to/api/health`