# Render Configuration

## ✅ CRITICAL: Enable HTTPS on Render

### Step 1: Custom Domain Setup
1. Go to Render Dashboard → Your Service
2. Click **"Settings"** tab
3. Scroll to **"Custom Domains"**
4. Add: `www.raoufz.com`
5. Add: `raoufz.com` (optional)
6. **IMPORTANT:** Enable **"Force HTTPS"** toggle ✅

### Step 2: DNS Configuration (on your domain provider)
Add these DNS records:

```
Type    Name    Value
CNAME   www     <your-render-service>.onrender.com
A       @       <Render IP from dashboard>
```

### Step 3: Environment Variables (Optional)
In Render Dashboard → Environment:
```
NODE_ENV=production
PORT=3000
```

### Step 4: Build & Deploy Settings
- **Build Command:** `npm install`
- **Start Command:** `node server.js`
- **Auto-Deploy:** ON (for GitHub pushes)

---

## 🔧 WebRTC Requirements

### HTTPS is MANDATORY for:
✅ Camera access  
✅ Microphone access  
✅ getUserMedia API  
✅ WebRTC on custom domains  

### What Render Provides:
✅ Free SSL certificate (auto-issued)  
✅ Automatic HTTPS redirect  
✅ HTTP/2 support  
✅ WebSocket over HTTPS  

---

## 🐛 Troubleshooting

### Problem: Video/Audio not working on www.raoufz.com
**Cause:** HTTP instead of HTTPS  
**Fix:** Enable "Force HTTPS" in Render settings

### Problem: Camera/Microphone blocked
**Cause:** Mixed content (HTTP + HTTPS)  
**Fix:** Ensure all resources load over HTTPS

### Problem: Socket.IO connection fails
**Cause:** CORS or proxy issues  
**Fix:** Already configured in server.js ✅

---

## ✅ Verification Checklist

After deployment:
- [ ] Open https://www.raoufz.com (HTTPS)
- [ ] Check browser shows 🔒 padlock icon
- [ ] Test camera permission popup appears
- [ ] Test microphone permission popup appears
- [ ] Create room successfully
- [ ] Join room from another device
- [ ] Video call connects within 10 seconds
- [ ] Audio call connects within 10 seconds

---

## 🚀 Current Status

**Domain:** www.raoufz.com  
**Server:** ✅ Configured for HTTPS  
**WebRTC:** ✅ STUN servers ready  
**Socket.IO:** ✅ WebSocket + polling  

**Action Required:**
1. Push updated code to GitHub
2. Render will auto-deploy
3. Enable "Force HTTPS" in Render settings
4. Test at https://www.raoufz.com
