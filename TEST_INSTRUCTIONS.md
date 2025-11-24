# 🧪 Testing Instructions for P2P Chat

## How to Test the Serverless P2P Connection

### Setup:
1. Open the website in **TWO different browsers** (e.g., Chrome and Firefox) OR two different devices
2. Make sure both browsers allow camera/microphone permissions

### Test Steps:

#### **User A (Room Creator):**
1. Click the **"+"** button (bottom right on mobile, sidebar on desktop)
2. Click **"Create Room"**
3. Wait for the 5-digit code to appear (e.g., `47291`)
4. Click **"Copy Full Message"** or **"Copy Link Only"**
5. Send the link/message to User B (via WhatsApp, SMS, email, etc.)
6. **WAIT** - You'll see a notification when User B connects
7. When User B connects, you'll see:
   - ✅ Toast: "Peer connected! You can now chat and call."
   - 🎉 Chat window opens automatically
   - System message appears explaining the P2P connection
   - Phone and video call buttons become **enabled** (not grayed out)

#### **User B (Joiner):**
1. Click the link shared by User A
2. You'll be **automatically connected** (no code entry needed!)
3. Chat window opens immediately with welcome message
4. Phone and video call buttons are **enabled**
5. You can start typing messages right away

### Testing Messaging:

#### **From User A:**
1. Type a message in the input box at the bottom
2. Press Enter or click the send button
3. Message appears on YOUR screen (blue bubble on right)
4. Message should appear on User B's screen (gray bubble on left)

#### **From User B:**
1. Type a message in the input box
2. Press Enter or click send
3. Message appears on YOUR screen (blue bubble on right)
4. Message should appear on User A's screen (gray bubble on left)

### Testing Audio Call:
1. Click the **phone icon** 📞 at the top
2. Other user sees incoming call notification
3. Accept the call
4. Both can hear each other
5. Click phone icon again to end call

### Testing Video Call:
1. Click the **camera icon** 🎥 at the top
2. Other user sees incoming call notification
3. Accept the call
4. Both can see and hear each other
5. Click red "End Call" button to disconnect

### Expected Behavior:

✅ **Messages are instant** (no refresh needed)
✅ **Both users can send/receive** messages
✅ **Call buttons work** for both users
✅ **No server processes media** - direct P2P connection
✅ **Connection survives** page refresh (if peer ID stays same)

### Troubleshooting:

❌ **If messages don't send:**
- Check browser console for errors (F12)
- Look for "✅ Data connection opened" message
- Make sure both users are on the same room

❌ **If User A doesn't see User B connect:**
- Check that PeerJS CDN loaded (check network tab)
- Verify the room code matches
- Try creating a new room

❌ **If calls don't work:**
- Allow camera/microphone permissions
- Check that call buttons are enabled (not grayed out)
- Make sure both peers are connected (green toast notification)

### Browser Console Logs to Look For:

**User A should see:**
```
🎬 createRoom function called
✅ Peer connected with ID: 47291
🔗 Incoming data connection from: peer-xxxxx
✅ Data connection opened with: peer-xxxxx
```

**User B should see:**
```
🔗 Silently joining room: 47291
✅ Peer connected with ID: peer-xxxxx
📡 User B connecting to User A: 47291
✅ Data connection opened with: 47291
```

**When sending messages:**
```
✅ Message sent via P2P: Hello!
📨 Received data: {type: 'message', text: 'Hi back!', timestamp: ...}
```

---

## 🚀 Quick Test (30 seconds):

1. **Browser 1**: Create room, copy link
2. **Browser 2**: Paste link in address bar, press Enter
3. **Browser 2**: Type "Hi!" and press Enter
4. **Browser 1**: Should see "Hi!" appear automatically
5. **Browser 1**: Type "Hello back!" and press Enter
6. **Browser 2**: Should see "Hello back!" appear automatically

✅ **Success!** Both users are connected via P2P and can chat!

---

## 📱 Mobile Testing:

Works the same way on mobile browsers (Chrome, Safari, Firefox)
- Create room on desktop, join on mobile
- Or create on mobile, join on another mobile device
- WhatsApp sharing works great for mobile-to-mobile

---

## 🔒 Privacy Features Working:

- ✅ No login required
- ✅ No database
- ✅ Messages sent directly peer-to-peer
- ✅ Server only helps with initial connection (signaling)
- ✅ Media streams direct between devices
- ✅ WebRTC encryption (DTLS-SRTP)
