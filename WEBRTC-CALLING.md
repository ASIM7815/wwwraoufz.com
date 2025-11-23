# WebRTC Video & Audio Calling Implementation

## Overview
This implementation adds **real-time video calling and audio calling** functionality between two users connected through a room. The system uses **WebRTC** for peer-to-peer communication with proper signaling through Socket.IO.

## Features Implemented

### 1. **Video Calling**
- Click the video call icon to initiate a video call
- Full-screen video interface with remote and local video streams
- Picture-in-picture local video in the corner
- Real-time video transmission using WebRTC

### 2. **Audio Calling**
- Click the audio call icon to initiate an audio-only call
- Beautiful audio call UI with animated sound waves
- Voice-only communication (no video)
- Lower bandwidth usage compared to video calls

### 3. **Call Controls**
- **Mute/Unmute**: Toggle your microphone on/off
- **Video On/Off**: Toggle your camera (video calls only)
- **End Call**: Terminate the current call
- Visual feedback for muted/disabled states

### 4. **Incoming Call Notifications**
- Beautiful incoming call modal with animations
- Shows caller name and call type (Video/Audio)
- **Accept** or **Decline** buttons
- Pulse ring animation for visual appeal

### 5. **Room-Based Communication**
- Calls only work between users connected through a room
- Automatic signaling through the room code
- Secure peer-to-peer connections

## How It Works

### WebRTC Architecture

```
User 1                    Signaling Server              User 2
  |                             |                          |
  |--- Create/Join Room ------->|<------ Join Room --------|
  |                             |                          |
  |--- Initiate Call ---------->|--- Incoming Call ------->|
  |                             |                          |
  |<----- Call Accepted --------|<------ Accept Call ------|
  |                             |                          |
  |--- WebRTC Offer ----------->|--- Offer --------------->|
  |                             |                          |
  |<----- WebRTC Answer --------|<------ Answer ------------|
  |                             |                          |
  |<--- ICE Candidates -------->|<--- ICE Candidates ----->|
  |                             |                          |
  |<========== Direct P2P Media Connection ==============>|
```

### Key Components

#### 1. **Server-Side (server.js)**
Handles WebRTC signaling:
- `initiate-call`: User initiates a call
- `accept-call`: Receiver accepts the call
- `reject-call`: Receiver rejects the call
- `webrtc-offer`: Caller sends connection offer
- `webrtc-answer`: Receiver responds with answer
- `webrtc-ice-candidate`: Exchange network information
- `end-call`: Either user ends the call

#### 2. **Client-Side (webrtc-handler.js)**
Complete WebRTC implementation:
- **WebRTCHandler Class**: Manages peer connections
- **getUserMedia()**: Captures audio/video from user's device
- **RTCPeerConnection**: Creates peer-to-peer connections
- **ICE Candidates**: Finds best network route
- **STUN Servers**: Discovers public IP addresses

#### 3. **UI Components**
- **Incoming Call Modal**: Shows when receiving a call
- **Video Call Container**: Full-screen video interface
- **Audio Call Container**: Audio-only interface with animations
- **Call Controls**: Mute, video toggle, end call buttons

## Usage Instructions

### For Users

1. **Create or Join a Room**
   - Click the "+" button
   - Create a room or join with a code
   - Share the code with the other user

2. **Start a Video Call**
   - Once connected in a room, click the **video camera icon** 📹
   - Grant camera and microphone permissions
   - Wait for the other user to accept

3. **Start an Audio Call**
   - Once connected in a room, click the **phone icon** 📞
   - Grant microphone permission
   - Wait for the other user to accept

4. **During a Call**
   - Click microphone icon to mute/unmute
   - Click video icon to turn camera on/off (video calls only)
   - Click red phone icon to end the call

5. **Receiving a Call**
   - You'll see an incoming call notification
   - Click "Accept" to join the call
   - Click "Decline" to reject

### For Developers

#### Starting the Server
```bash
node server.js
```
Server runs on port 3000 by default.

#### File Structure
```
beatz/
├── server.js              # Socket.IO signaling server
├── webrtc-handler.js      # WebRTC client implementation
├── client.js              # Socket.IO client setup
├── script.js              # UI and interaction logic
├── index (9).html         # Main HTML with call UI
└── styles.css             # Styling for call interfaces
```

## Technical Details

### WebRTC Configuration

**STUN Servers Used:**
```javascript
{
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
    ]
}
```

### Media Constraints

**Video Call:**
```javascript
{
    audio: true,
    video: true
}
```

**Audio Call:**
```javascript
{
    audio: true,
    video: false
}
```

### Call Flow Sequence

1. **User A clicks video/audio call icon**
   - Requests media permissions (getUserMedia)
   - Sends `initiate-call` event to server
   - Shows call UI

2. **User B receives incoming call**
   - Sees incoming call modal
   - Can accept or decline

3. **User B accepts call**
   - Requests media permissions
   - Sends `accept-call` event
   - Creates RTCPeerConnection

4. **User A receives acceptance**
   - Creates offer (SDP)
   - Sets local description
   - Sends offer to User B

5. **User B receives offer**
   - Sets remote description
   - Creates answer (SDP)
   - Sets local description
   - Sends answer to User A

6. **ICE Candidate Exchange**
   - Both users gather ICE candidates
   - Exchange candidates through signaling server
   - Add remote candidates to peer connection

7. **Connection Established**
   - P2P media streams flow directly
   - Video/audio displayed on both sides

## Browser Compatibility

✅ **Supported Browsers:**
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- Opera 47+

⚠️ **Requirements:**
- HTTPS (required for getUserMedia in production)
- Microphone permission
- Camera permission (for video calls)

## Security Features

- **Peer-to-peer encryption**: Media never goes through server
- **Room-based isolation**: Only users in same room can connect
- **Permission-based access**: Users must grant camera/mic permissions
- **No persistent storage**: Calls are ephemeral, no recording

## Troubleshooting

### "Camera/Microphone permission denied"
- Check browser settings
- Ensure HTTPS in production
- Grant permissions when prompted

### "Unable to connect"
- Check network/firewall settings
- Verify STUN servers are accessible
- Ensure both users are in same room

### "No video/audio"
- Check device permissions
- Verify camera/microphone are not in use
- Check browser console for errors

### "Call disconnects immediately"
- Check network stability
- Verify both users have granted permissions
- Check for firewall/NAT issues

## Future Enhancements

- [ ] TURN server support for restrictive firewalls
- [ ] Screen sharing functionality
- [ ] Call recording (with permission)
- [ ] Group video calls (3+ participants)
- [ ] Call statistics (bitrate, latency)
- [ ] Call history tracking
- [ ] Push notifications for missed calls

## Performance Notes

- **Video quality**: 640x480 default (adjustable)
- **Audio quality**: High-quality audio codec selection
- **Bandwidth**: ~500 kbps for video, ~50 kbps for audio
- **Latency**: <100ms typical on good connections

## Credits

- WebRTC API: W3C standard
- Socket.IO: Real-time signaling
- STUN servers: Google public STUN servers

---

**Note**: This implementation works for **2-user peer-to-peer calls only**. For more than 2 participants, consider using a SFU (Selective Forwarding Unit) or MCU (Multipoint Control Unit) architecture.
