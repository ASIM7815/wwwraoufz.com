# 🚀 Serverless P2P Video & Audio Calling - RAOUFz

## ✨ Overview

This application implements **truly serverless peer-to-peer (P2P) video and audio calling** using **WebRTC** and **PeerJS**. 

### Key Features:
- 🔥 **Zero Backend Required** - No server to maintain
- 🔒 **End-to-End Encrypted** - Media streams directly between users
- ⚡ **Low Latency** - Direct P2P connection, no relay
- 📱 **Works on Mobile & Desktop** - Responsive design
- 🔗 **Smart Link Sharing** - One-click join via shareable links
- 💬 **Integrated Chat** - Message during calls
- 🎥 **Video & Audio Calls** - Full WebRTC support

---

## 🎯 How It Works

### 1. **Create Room**
When User A clicks "Create Room":
- Generates a **5-digit unique code** (e.g., `12345`)
- Creates a PeerJS connection with this code as the peer ID
- Generates a **shareable link**: `https://yoursite.com/?room=12345`
- Creates a **pre-planned message** ready to copy/share

### 2. **Share the Link**
User A shares via:
- 📋 **Copy Share Message** - Pre-written message with link and code
- 📤 **Share via Apps** - Uses Web Share API (WhatsApp, SMS, etc.)
- 🔗 **Copy Link Only** - Just the URL

**Sample Share Message:**
```
🎉 Join my video chat room!

🔗 Click this link: https://yoursite.com/?room=12345

🔑 Or enter code: 12345

✨ No login required - instant connection!
```

### 3. **Auto-Join via Link**
When User B clicks the shared link:
- URL parameter `?room=12345` is automatically detected
- Room code is **auto-filled** in the join input
- User B can instantly join with one click
- **No manual code entry needed!**

### 4. **Direct P2P Connection**
After joining:
- Both users are connected via PeerJS signaling
- Click 📞 for **audio call** or 📹 for **video call**
- Media streams flow **directly between devices** (P2P)
- No server processes your audio/video data

---

## 🔧 Technical Architecture

### PeerJS (Signaling Server)
- **Free public cloud service** at `0.peerjs.com`
- Only used for **initial connection setup** (signaling)
- Exchanges:
  - IP addresses and ports (ICE candidates)
  - Session descriptions (SDP offers/answers)
  - Encryption keys

### WebRTC (Media Transport)
- **Direct peer-to-peer** media streaming
- Uses STUN servers for NAT traversal:
  - `stun:stun.l.google.com:19302`
  - `stun:stun1.l.google.com:19302`
- Automatically finds best route between peers
- End-to-end encrypted (DTLS-SRTP)

### No Backend Required
- ✅ Frontend only (HTML, CSS, JavaScript)
- ✅ Can be hosted on **GitHub Pages**, Netlify, Vercel
- ✅ No database, no server code, no hosting costs
- ✅ Scales infinitely (each call is independent)

---

## 📦 What's Included

### New Features Added:

1. **5-Digit Room Codes**
   - Short, memorable codes
   - Easy to share verbally if needed

2. **Smart Link Sharing**
   ```javascript
   // Auto-detects room code from URL
   const urlParams = new URLSearchParams(window.location.search);
   const roomCode = urlParams.get('room');
   ```

3. **Pre-Planned Share Messages**
   - Click "Copy Share Message" for instant sharing
   - Formatted for WhatsApp, SMS, Email, etc.

4. **Video Call UI**
   - Full-screen video interface
   - Floating local video (picture-in-picture style)
   - Call controls: Mute, Camera, End Call
   - Call duration timer

5. **Incoming Call Modal**
   - Beautiful animated modal for incoming calls
   - Answer/Decline buttons
   - Shows caller information

6. **Call Controls**
   - 🔇 **Mute/Unmute** audio
   - 📷 **Camera on/off**
   - 📞 **End call**

---

## 🚀 How to Use

### For Room Creator (User A):

1. Click the **"+"** button
2. Select **"Create Room"**
3. A 5-digit code is generated (e.g., `12345`)
4. Click **"📋 Copy Share Message"** to copy pre-written message
5. Paste in WhatsApp, SMS, or any messaging app
6. Wait for User B to join
7. Click **📞** or **📹** to start a call

### For Joiner (User B):

**Method 1: Via Link (Easiest)**
1. Click the shared link received from User A
2. Browser opens with code auto-filled
3. Confirm "Auto-join now?" prompt
4. Connected! 🎉

**Method 2: Manual Code Entry**
1. Click the **"+"** button
2. Select **"Join Room"**
3. Enter the 5-digit code
4. Click **"Join Room"**

### Making Calls:

Once connected in a room:
- Click **📞 Audio Call** - Voice only
- Click **📹 Video Call** - Video + Audio
- Answer incoming calls via modal
- Use controls during call (mute, camera, end)

---

## 🔒 Privacy & Security

### What's Secure:
✅ **End-to-End Encrypted Media** - Only you and your peer can decrypt  
✅ **Direct P2P** - No server sees your video/audio  
✅ **Temporary Codes** - Rooms exist only during session  
✅ **No Data Storage** - Nothing saved to databases  

### What's Shared with PeerJS:
⚠️ IP addresses (for P2P connection)  
⚠️ Session metadata (not media content)  

### Recommendations:
- Share room codes privately (WhatsApp, Signal, etc.)
- Don't post codes publicly
- Rooms are single-use - create new for each call

---

## 🌐 Deployment Options

### Option 1: GitHub Pages (Recommended)
```bash
# Just push to GitHub
git add .
git commit -m "Add serverless video calls"
git push origin main

# Enable GitHub Pages in repository settings
# Settings → Pages → Source: main branch
```

### Option 2: Netlify
```bash
# Drag & drop your folder to Netlify
# Or connect GitHub repo
```

### Option 3: Vercel
```bash
# Import GitHub repo to Vercel
# Auto-deploys on every push
```

### Option 4: Local Testing
```bash
# Serve with Python
python -m http.server 8000

# Or with Node.js
npx http-server -p 8000
```

**Important:** Access via `localhost` or `https://` - Camera/mic require secure context!

---

## 🛠️ Customization

### Change PeerJS Server
```javascript
// In script.js, modify initializePeer():
peer = new Peer(peerId, {
    host: 'your-peerjs-server.com',  // Change this
    port: 443,
    path: '/',
    secure: true
});
```

### Add TURN Server (for strict firewalls)
```javascript
config: {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { 
            urls: 'turn:your-turn-server.com:3478',
            username: 'user',
            credential: 'pass'
        }
    ]
}
```

### Customize Room Code Length
```javascript
// In createRoom() function:
const roomCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
```

---

## 📊 Browser Support

| Browser | Video Calls | Audio Calls | Screen Share |
|---------|------------|-------------|--------------|
| Chrome 90+ | ✅ | ✅ | ✅ |
| Firefox 88+ | ✅ | ✅ | ✅ |
| Safari 14+ | ✅ | ✅ | ⚠️ Limited |
| Edge 90+ | ✅ | ✅ | ✅ |
| Mobile Chrome | ✅ | ✅ | ❌ |
| Mobile Safari | ✅ | ✅ | ❌ |

**Note:** Requires `https://` in production (except localhost)

---

## 🐛 Troubleshooting

### "Could not access camera/microphone"
- Grant browser permissions when prompted
- Use `https://` (not `http://`)
- Check if camera/mic is already in use

### "Failed to connect to peer"
- Both users must be in the same room
- Check internet connection
- Try refreshing and rejoining
- Some corporate networks block WebRTC (use TURN)

### "No incoming call to answer"
- Ensure User B joined the room before User A calls
- Check browser console for errors
- Try creating a new room

### Link sharing not working
- Ensure room code is in URL: `?room=12345`
- Check browser supports `navigator.share()` (or use copy fallback)

---

## 📝 Code Structure

```
wwwraoufz.com/
├── index.html          # Main HTML with PeerJS SDK
├── script.js           # WebRTC logic (500+ lines)
│   ├── initializePeer()      # Connect to PeerJS
│   ├── createRoom()          # Generate room code
│   ├── joinRoom()            # Join existing room
│   ├── startVideoCall()      # Initiate video call
│   ├── startAudioCall()      # Initiate audio call
│   ├── handleIncomingCall()  # Handle incoming calls
│   ├── answerCall()          # Answer call
│   └── endCall()             # Cleanup
├── styles.css          # Video call UI styles
└── README_SERVERLESS_VIDEO_CALLS.md
```

---

## 🎓 How This Achieves "Serverless"

### What "Serverless" Means Here:

1. **No Application Server**
   - No Node.js, Python, PHP backend
   - No Express, Flask, Django
   - Just static HTML/CSS/JS files

2. **No Media Server**
   - Video/audio doesn't go through a server
   - Direct peer-to-peer streaming
   - Server never sees or processes media

3. **Free Signaling Service**
   - PeerJS provides free cloud signaling
   - Only for initial connection setup
   - Alternative: Run your own PeerJS server

4. **Scalable by Design**
   - Each call is independent
   - No server load regardless of user count
   - Deploy to CDN (Cloudflare, etc.)

### Small Print:
- ⚠️ PeerJS cloud is "free but not yours" - for production, consider self-hosting
- ⚠️ Some networks (10-15%) need TURN relay (not fully P2P)
- ⚠️ Multi-party calls (3+) need different architecture (SFU/MCU)

---

## 🚀 Future Enhancements

Possible additions:
- [ ] Screen sharing
- [ ] Recording calls (local only)
- [ ] Group calls (mesh or SFU)
- [ ] File sharing via WebRTC Data Channels
- [ ] Virtual backgrounds
- [ ] Chat history (localStorage)
- [ ] QR code for room sharing

---

## 📄 License

MIT License - Feel free to use, modify, and distribute!

---

## 🙌 Credits

Built with:
- **WebRTC** - Real-time communication
- **PeerJS** - Simplified WebRTC signaling
- **Vanilla JavaScript** - No frameworks
- **CSS3** - Modern UI

---

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Verify HTTPS is enabled
3. Test on different network (some block WebRTC)
4. Try different browser

---

**Enjoy your serverless video calling! 🎉**
