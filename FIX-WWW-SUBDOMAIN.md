# ✅ FIX: www.raoufz.com WebRTC Issue

## 🎯 Actual Problem:
You're using **www.raoufz.com** instead of **raoufz.com** - both need to work properly with HTTPS and WebRTC.

## ✅ Solution Applied:

### Updated `server.js` to:
1. ✅ Accept both `www.raoufz.com` AND `raoufz.com`
2. ✅ Force HTTPS on both domains
3. ✅ Handle proxy headers correctly (301 redirect)

---

## 🚀 DEPLOY & TEST:

### Step 1: Push Code
```bash
git add .
git commit -m "Fix www subdomain for WebRTC"
git push origin main
```

### Step 2: Configure Render (CRITICAL)

#### A. Add Both Domains:
In Render Dashboard → Settings → Custom Domains:
1. Add: `www.raoufz.com` ✅
2. Add: `raoufz.com` ✅
3. **Enable "Force HTTPS" for BOTH** ✅

#### B. Set Environment Variable:
In Render → Environment:
```
NODE_ENV=production
```

#### C. Wait for SSL:
- Both domains should show ✅ with SSL certificate
- Takes 1-5 minutes for SSL to activate

---

## 🧪 Testing Checklist:

### Test 1: HTTPS on www subdomain
```bash
# Should return 200 and HTTPS
curl -I https://www.raoufz.com
```
✅ Should show: `HTTP/2 200` and 🔒

### Test 2: HTTPS on root domain
```bash
# Should return 200 and HTTPS
curl -I https://raoufz.com
```
✅ Should show: `HTTP/2 200` and 🔒

### Test 3: WebRTC on www
1. Open: **https://www.raoufz.com**
2. Create room
3. Browser asks for camera/mic permissions ✅
4. Start video call → connects in 3-10 seconds ✅

### Test 4: WebRTC on root
1. Open: **https://raoufz.com**
2. Create room
3. Browser asks for camera/mic permissions ✅
4. Start video call → connects in 3-10 seconds ✅

---

## 🔍 Why It Matters:

| Issue | Impact | Fix |
|-------|--------|-----|
| www vs non-www | Different origins | Both configured ✅ |
| HTTP on www | WebRTC blocked | HTTPS forced ✅ |
| CORS mismatch | Socket.IO fails | Both allowed ✅ |
| Proxy headers | Wrong protocol detected | Trust proxy ✅ |

---

## ⚙️ What Was Changed:

### server.js (lines 32-40):
```javascript
// Accept both www and non-www
app.use((req, res, next) => {
  const host = req.header('host');
  
  if (process.env.NODE_ENV === 'production' && 
      req.header('x-forwarded-proto') !== 'https') {
    // Force HTTPS on both domains
    return res.redirect(301, `https://${host}${req.url}`);
  }
  next();
});
```

### CORS (line 10):
```javascript
origin: [
  "*", 
  "https://www.raoufz.com",  // www subdomain ✅
  "https://raoufz.com",       // root domain ✅
  "http://localhost:3000"     // local dev ✅
]
```

---

## 🎯 Quick Action Plan:

### Immediate (Now):
1. ✅ Code updated (server.js)
2. ⚠️ Push to GitHub
3. ⚠️ Render auto-deploys (2-3 min)

### On Render Dashboard:
4. ⚠️ Add both domains (www and non-www)
5. ⚠️ Enable Force HTTPS on BOTH
6. ⚠️ Set NODE_ENV=production
7. ⚠️ Wait for SSL certificates (1-5 min)

### Testing:
8. ⚠️ Test https://www.raoufz.com
9. ⚠️ Test https://raoufz.com
10. ⚠️ Test video/audio calls on both

---

## 🚨 Common Mistakes to Avoid:

### ❌ Only adding one domain
**Fix:** Add BOTH www and non-www on Render

### ❌ Not enabling Force HTTPS
**Fix:** Toggle ON "Force HTTPS" for each domain

### ❌ Testing on HTTP
**Fix:** Always use https:// in browser

### ❌ Not setting NODE_ENV
**Fix:** Add NODE_ENV=production in Render environment

---

## ✅ Expected Result:

After deployment:
- ✅ `https://www.raoufz.com` → Works
- ✅ `https://raoufz.com` → Works
- ✅ Video calls → Connect instantly
- ✅ Audio calls → Connect instantly
- ✅ No CORS errors
- ✅ No mixed content warnings

---

## 📞 Health Check:

Visit: `https://www.raoufz.com/health`

Should return:
```json
{
  "status": "healthy",
  "secure": true,
  "protocol": "https"
}
```

🚀 **Deploy now - both domains will work!**
