# 🚀 Railway Deployment - Quick Reference

## One-Line Deploy Commands

### Option 1: GitHub (Recommended)
```bash
git add . && git commit -m "Deploy to Railway" && git push origin main
# Then: Go to railway.app → New Project → Deploy from GitHub
```

### Option 2: Railway CLI
```bash
npm i -g @railway/cli && railway login && railway init && railway up
```

### Option 3: Interactive Script
```powershell
.\deploy-railway.ps1
```

---

## Files Modified/Created

### Modified for Railway
- ✅ `server.js` - Railway-optimized configuration
- ✅ `script.js` - Auto-join feature (line 515-544)
- ✅ `package.json` - Test scripts added

### Created for Railway
- ✅ `railway.json` - Railway configuration
- ✅ `nixpacks.toml` - Build configuration
- ✅ `.railwayignore` - Deployment exclusions
- ✅ `test-railway.js` - Testing script
- ✅ `deploy-railway.ps1` - Deployment helper
- ✅ `RAILWAY-DEPLOYMENT.md` - Full guide
- ✅ `RAILWAY-CHECKLIST.md` - Step-by-step checklist
- ✅ `RAILWAY-READY.md` - Complete summary

---

## Critical Features Enabled

### ✅ Video/Audio Calling
- WebRTC peer-to-peer connections
- Multiple STUN servers configured
- HTTPS support (automatic on Railway)
- Group calling support

### ✅ Auto-Join Feature
- No "Join Now" button
- Automatic room connection
- Seamless user experience

### ✅ Railway Optimization
- 60s WebSocket timeout
- Message compression
- Auto-scaling ready
- Health monitoring

---

## Test Your Deployment

### Local Test
```bash
npm start
# Visit: http://localhost:3000
```

### After Railway Deployment
```bash
curl https://yourapp.railway.app/health
```

Expected: `{"status":"healthy",...}`

---

## URLs to Remember

| Purpose | URL |
|---------|-----|
| **Railway Dashboard** | https://railway.app |
| **Your App** | `https://yourapp.railway.app` |
| **Health Check** | `https://yourapp.railway.app/health` |
| **WebRTC Config** | `https://yourapp.railway.app/api/webrtc-config` |

---

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| **Deploy failed** | Check `railway logs` |
| **Can't access camera** | Must use HTTPS (Railway provides) |
| **WebSocket won't connect** | Check CORS in Railway logs |
| **Video quality poor** | Check network, try different browser |
| **Auto-join not working** | Check browser console, verify URL has `?room=` |

---

## Testing Checklist

- [ ] Deploy to Railway
- [ ] Health check returns 200
- [ ] Open app in browser
- [ ] Create room
- [ ] Copy room link
- [ ] Open link in new browser/incognito
- [ ] **Verify auto-join (no "Join Now" button)**
- [ ] Start video call
- [ ] Test audio call
- [ ] Test on mobile

---

## Support

- **Documentation**: See `RAILWAY-DEPLOYMENT.md`
- **Checklist**: See `RAILWAY-CHECKLIST.md`
- **Railway Docs**: https://docs.railway.app/
- **Test Script**: `npm test`

---

## Success Indicators

### Deployment Successful When:
1. ✅ Railway shows "Active" status
2. ✅ No errors in logs
3. ✅ `/health` endpoint works
4. ✅ App loads in browser
5. ✅ Video/audio calls work
6. ✅ Auto-join feature works

---

## 🎉 You're Ready!

**Everything is configured for Railway deployment.**

Choose your deployment method above and go live! 🚀

---

### Quick Start
```bash
# 1. Commit your code
git add . && git commit -m "Railway ready"

# 2. Push to GitHub
git push origin main

# 3. Deploy on Railway
# Visit: railway.app → New Project → Deploy from GitHub

# ✅ Done!
```
