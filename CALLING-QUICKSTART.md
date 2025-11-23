# Quick Start: Video & Audio Calling

## 🚀 How to Use the New Video & Audio Call Features

### Step 1: Start the Server
```bash
node server.js
```
✅ Server will run on `http://localhost:3000`

### Step 2: Open Two Browser Windows
1. Open `http://localhost:3000` in Browser Window 1
2. Open `http://localhost:3000` in Browser Window 2

### Step 3: Create a Room
**In Window 1:**
1. Click the **"+"** (plus) button at bottom right
2. Click **"Create Room"**
3. Copy the 6-character room code (e.g., `ABC123`)

### Step 4: Join the Room
**In Window 2:**
1. Click the **"+"** (plus) button
2. Click **"Join Room"**
3. Enter the room code from Window 1
4. Click **"Join Room"** button

✅ Both users are now connected!

### Step 5: Make a Video Call

**Option A: Start Video Call**
1. Click the **📹 video camera icon** in the chat header
2. Grant camera and microphone permissions when prompted
3. In the other window, you'll see an incoming call notification
4. Click **"Accept"** to start the video call
5. You'll see both video streams!

**Option B: Start Audio Call**
1. Click the **📞 phone icon** in the chat header
2. Grant microphone permission when prompted
3. In the other window, accept the incoming call
4. Audio-only call starts!

### Step 6: During the Call

**Video Call Controls:**
- 🎤 **Mute/Unmute**: Toggle microphone
- 📹 **Video On/Off**: Toggle camera
- 📞 **End Call**: Hang up (red button)

**Audio Call Controls:**
- 🎤 **Mute/Unmute**: Toggle microphone
- 📞 **End Call**: Hang up (red button)
- 🔊 **Speaker**: Audio output control

## 🎯 Key Points

### ✅ DO's
- ✅ Create/Join a room BEFORE making calls
- ✅ Grant camera/microphone permissions
- ✅ Use HTTPS in production (required for getUserMedia)
- ✅ Test with 2 browser windows or 2 devices on same network

### ❌ DON'Ts
- ❌ Don't try to call without joining a room
- ❌ Don't block browser permissions
- ❌ Don't use more than 2 users per room (P2P only)

## 🔧 Troubleshooting

### "Please join a room first!"
→ You must be in a room with another user before calling

### "Camera/Microphone permission denied"
→ Click the camera icon in browser address bar and allow permissions

### Call doesn't connect
→ Make sure both users are in the SAME room

### No video/audio visible
→ Check if other applications are using camera/microphone

## 📱 Mobile Testing

Works on mobile browsers too!
1. Access via local network: `http://YOUR_IP:3000`
2. For production, use HTTPS (required)

## 🎨 UI Features

### Incoming Call Modal
- Beautiful animated pulse rings
- Shows caller name
- Accept/Decline buttons

### Video Call Interface
- Full-screen remote video
- Picture-in-picture local video (top-right corner)
- Floating control buttons at bottom

### Audio Call Interface
- Large avatar display
- Animated sound waves
- Call duration timer
- Clean, minimal design

## 🔐 Privacy & Security

- **Peer-to-Peer**: Video/audio streams directly between users
- **No Recording**: Calls are not recorded or stored
- **Ephemeral**: All data disappears when call ends
- **Permission-Based**: Users must explicitly grant access

## 📊 What Makes This Different?

| Feature | This Implementation |
|---------|-------------------|
| **Video Calling** | ✅ Click video icon, instant P2P call |
| **Audio Calling** | ✅ Click phone icon, voice-only mode |
| **Separate Controls** | ✅ Different icons for video vs audio |
| **Room-Based** | ✅ Only users in same room can call |
| **Direct Connection** | ✅ No media goes through server |
| **WebRTC Native** | ✅ No third-party services required |

## 🎯 Testing Scenarios

### Test 1: Video Call
1. User A creates room
2. User B joins room  
3. User A clicks video icon 📹
4. User B accepts
5. ✅ Both see video streams

### Test 2: Audio Call
1. User A creates room
2. User B joins room
3. User A clicks phone icon 📞
4. User B accepts
5. ✅ Voice communication only

### Test 3: Reject Call
1. User A calls User B
2. User B clicks "Decline"
3. ✅ Call is rejected, User A notified

### Test 4: End Call
1. Active call in progress
2. Either user clicks red end button
3. ✅ Call terminates for both users

## 🌐 Network Requirements

- **Local Network**: Works out of the box
- **Internet**: Requires STUN servers (already configured)
- **Firewall**: May need TURN server for strict NAT

## 📞 Support

For issues, check:
1. Browser console (F12)
2. Network tab for WebSocket connection
3. Granted permissions for camera/mic

---

**🎉 You're ready to make video and audio calls!**

Just remember: **Create/Join Room → Click Video/Audio Icon → Accept Call → Talk!**
