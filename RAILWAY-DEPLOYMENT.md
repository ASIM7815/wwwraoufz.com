# Railway Deployment Guide for Video/Audio Calling App

## ✅ Prerequisites Completed
- ✅ Server configured for Railway with proper CORS and WebSocket support
- ✅ WebRTC STUN servers configured
- ✅ HTTPS redirect configured for Railway
- ✅ Health check endpoint added
- ✅ Railway configuration files created

## 🚀 Quick Deployment Steps

### 1. Push Code to GitHub
```bash
git init
git add .
git commit -m "Initial commit - Railway deployment ready"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy to Railway

#### Option A: Using Railway Dashboard
1. Go to [Railway.app](https://railway.app)
2. Sign in with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your repository
6. Railway will automatically detect your Node.js app

#### Option B: Using Railway CLI
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

### 3. Configure Environment Variables (Optional)
In Railway Dashboard → Your Project → Variables:
- `NODE_ENV` = `production`
- `PORT` = `3000` (Railway sets this automatically)

### 4. Enable Custom Domain (Optional)
1. Go to your Railway project
2. Click **Settings** → **Domains**
3. Click **Generate Domain** for a free Railway domain
4. Or add your custom domain (e.g., raoufz.com)

## 🔧 Key Features Enabled

### ✅ WebSocket Support
- **Transport**: WebSocket with polling fallback
- **Timeout**: 60 seconds ping timeout
- **Automatic reconnection**: Enabled

### ✅ WebRTC Support
- **STUN Servers**: Multiple Google STUN servers configured
- **ICE Gathering**: Optimized for Railway
- **HTTPS**: Automatic HTTPS provided by Railway

### ✅ Video/Audio Calling
- **Peer-to-peer**: Direct WebRTC connections
- **Group calls**: Mesh network topology
- **Quality monitoring**: Connection quality checks

## 🧪 Testing After Deployment

### 1. Check Health Endpoint
```bash
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "environment": "production",
  "activeRooms": 0,
  "activeConnections": 0
}
```

### 2. Check WebRTC Config
```bash
curl https://your-app.railway.app/api/webrtc-config
```

### 3. Test Video/Audio Call
1. Open app: `https://your-app.railway.app`
2. Create a room (click + button)
3. Copy and share the room link
4. Open link in another browser/device
5. Test video/audio call buttons

## 🔒 Security Notes

### HTTPS (Required for WebRTC)
✅ Railway automatically provides HTTPS
✅ Server configured to redirect HTTP → HTTPS
✅ WebRTC requires HTTPS to access camera/microphone

### CORS Configuration
✅ Configured for all origins (adjust for production if needed)
✅ Proper headers for WebRTC signaling

## 📊 Monitoring

### Railway Dashboard
- **Logs**: Real-time application logs
- **Metrics**: CPU, Memory, Network usage
- **Deployments**: Track deployment history

### Application Logs
Check logs for:
- `✓ Server running on port 3000`
- `User connected: <socket-id>`
- `👤 User joined room`

## 🛠️ Troubleshooting

### Issue: WebSocket not connecting
**Solution**: Check Railway logs for connection errors
```bash
railway logs
```

### Issue: Video/Audio not working
**Checklist**:
- ✅ HTTPS enabled (Railway provides this)
- ✅ Browser permissions granted for camera/microphone
- ✅ STUN servers accessible
- ✅ Not behind strict firewall

### Issue: Deployment failed
**Common fixes**:
```bash
# Check Node version in package.json
"engines": {
  "node": ">=18.0.0"
}

# Ensure all dependencies installed
npm install

# Check Railway build logs
railway logs --build
```

## 🎯 Performance Optimization

### Railway Configuration
- **Region**: Choose closest to your users
- **Resources**: Railway auto-scales based on usage
- **CDN**: Automatic for static files

### WebSocket Optimization
- ✅ Connection pooling enabled
- ✅ Message compression enabled
- ✅ Automatic reconnection

## 📱 Mobile Support

### iOS/Android Testing
1. Open deployment URL on mobile
2. Grant camera/microphone permissions
3. Test in both browsers (Safari/Chrome)
4. Test with cellular and WiFi

## 🔄 Updating Your App

```bash
# Make changes
git add .
git commit -m "Update features"
git push origin main

# Railway auto-deploys on push
# Or manually trigger:
railway up
```

## 💡 Auto-Join Feature

✅ **Enabled**: Users automatically join when clicking shared room links
- No "Join Now" button required
- Seamless connection experience
- Works on both desktop and mobile

## 📞 Features Verified

- ✅ **Create Room**: Generate unique room codes
- ✅ **Share Room**: Copy link to share
- ✅ **Auto-Join**: Click link → auto-connect
- ✅ **Video Call**: Peer-to-peer video
- ✅ **Audio Call**: Peer-to-peer audio
- ✅ **Group Calls**: Multiple participants
- ✅ **Chat**: Real-time messaging
- ✅ **Mobile**: Responsive design

## 🎉 Your App is Ready!

Your video/audio calling app is now configured for Railway deployment with:
- ✅ Automatic HTTPS
- ✅ WebSocket support
- ✅ WebRTC enabled
- ✅ Auto-join functionality
- ✅ Mobile support
- ✅ Production-ready

## 📚 Resources

- [Railway Documentation](https://docs.railway.app/)
- [WebRTC Documentation](https://webrtc.org/)
- [Socket.IO Documentation](https://socket.io/docs/)

## 🆘 Support

If you encounter issues:
1. Check Railway logs: `railway logs`
2. Check browser console for errors
3. Verify HTTPS is enabled
4. Test on different browsers/devices
