# 🧪 Audio/Video Testing & Debugging Guide

## 🚨 CRITICAL FIXES APPLIED

### **Bug #1: Infinite Recursion in Logging** ✅ FIXED
**Problem**: The log methods were calling themselves infinitely
```javascript
// BEFORE (BROKEN)
log(...args) {
    if (this.DEBUG) this.log(...args); // ❌ Calls itself = infinite loop!
}

// AFTER (FIXED)
log(...args) {
    if (this.DEBUG) console.log('[WebRTC]', ...args); // ✅ Calls console.log
}
```

### **Bug #2: Debug Mode Disabled** ✅ FIXED
**Problem**: `this.DEBUG = false` meant NO logging at all
```javascript
// BEFORE
this.DEBUG = false; // ❌ No logs visible

// AFTER  
this.DEBUG = true; // ✅ Full logging enabled
```

### **Bug #3: Audio Tracks Not Properly Monitored** ✅ FIXED
**Problem**: No monitoring of audio track state changes
```javascript
// ADDED: Monitor audio track lifecycle
event.track.onmute = () => {
    console.warn('⚠️ Audio track was muted! Re-enabling...');
    event.track.enabled = true;
};

event.track.onunmute = () => {
    console.log('✅ Audio track unmuted');
};
```

### **Bug #4: No TURN Servers** ✅ FIXED
**Problem**: Only STUN servers = fails behind strict NAT/firewalls
```javascript
// ADDED: Free TURN servers for NAT traversal
{
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject'
}
```

### **Bug #5: Timer Not Starting** ✅ FIXED
**Problem**: Timer starts but not visible due to logging issues
```javascript
// ENHANCED: Better timer start logging
if (!this.callTimerInterval) {
    this.startCallTimer();
    this.log('⏱️ Call timer started');
}
```

## 📋 Testing Checklist

### ✅ Pre-Deployment Tests

#### 1. **Open Browser Console** (F12)
```
MUST SEE these logs:
[WebRTC] 🔗 Creating RTCPeerConnection...
[WebRTC] 📤 Adding local stream tracks...
[WebRTC] 📥 Received remote track: audio
[WebRTC] 🔊 AUDIO TRACK RECEIVED - forcing enabled
[WebRTC] ✅ Remote video playing successfully
[WebRTC] ⏱️ Call timer started
```

#### 2. **Check Audio Settings**
Open console and run:
```javascript
const video = document.getElementById('remoteVideoElement');
console.log('Muted:', video.muted); // Should be: false
console.log('Volume:', video.volume); // Should be: 1
console.log('Audio tracks:', video.srcObject?.getAudioTracks()); // Should show tracks
```

#### 3. **Verify Tracks**
```javascript
const stream = document.getElementById('remoteVideoElement').srcObject;
stream.getAudioTracks().forEach(track => {
    console.log('Audio track:', track.label);
    console.log('Enabled:', track.enabled); // Must be true
    console.log('Muted:', track.muted); // Should be false
    console.log('ReadyState:', track.readyState); // Should be 'live'
});
```

### 🌐 After Deployment Testing

#### Test 1: Same Device (2 Browsers)
```
1. Open Chrome: Create room "TEST123"
2. Open Firefox: Join room "TEST123"
3. Chrome: Click Video Call
4. Firefox: Accept Call
5. CHECK: Can you see each other? ✅
6. CHECK: Can you hear each other? ✅
7. CHECK: Is timer running? ✅
8. CHECK: Console shows logs? ✅
```

#### Test 2: PC to Mobile
```
1. PC: Create room, get link
2. Mobile: Open link (auto-join)
3. PC: Start video call
4. Mobile: Accept
5. CHECK: Audio works both ways ✅
6. CHECK: Video displays ✅
7. CHECK: Timer visible ✅
8. CHECK: Flip camera works (mobile) ✅
```

#### Test 3: Mobile to Mobile
```
1. Phone 1: Create room
2. Phone 2: Join via link
3. Start call
4. CHECK: Audio clear ✅
5. CHECK: Video smooth ✅
6. CHECK: No echo ✅
```

## 🔍 Debugging Commands

### Check Remote Video Element
```javascript
const rv = document.getElementById('remoteVideoElement');
console.log({
    srcObject: rv.srcObject,
    muted: rv.muted,
    volume: rv.volume,
    paused: rv.paused,
    readyState: rv.readyState,
    audioTracks: rv.srcObject?.getAudioTracks().map(t => ({
        label: t.label,
        enabled: t.enabled,
        muted: t.muted,
        readyState: t.readyState
    }))
});
```

### Check WebRTC Handler State
```javascript
console.log({
    isCallActive: webrtcHandler.isCallActive,
    hasLocalStream: !!webrtcHandler.localStream,
    hasRemoteStream: !!webrtcHandler.remoteStream,
    localTracks: webrtcHandler.localStream?.getTracks().map(t => t.kind),
    remoteTracks: webrtcHandler.remoteStream?.getTracks().map(t => t.kind),
    timerRunning: !!webrtcHandler.callTimerInterval,
    peerState: webrtcHandler.peerConnection?.connectionState
});
```

### Force Audio Playback
```javascript
const video = document.getElementById('remoteVideoElement');
video.muted = false;
video.volume = 1.0;
video.play()
    .then(() => console.log('✅ Playing'))
    .catch(e => console.error('❌ Failed:', e));
```

### Monitor Audio Levels
```javascript
const stream = document.getElementById('remoteVideoElement').srcObject;
const audioContext = new AudioContext();
const source = audioContext.createMediaStreamSource(stream);
const analyser = audioContext.createAnalyser();
source.connect(analyser);

const dataArray = new Uint8Array(analyser.frequencyBinCount);
setInterval(() => {
    analyser.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    console.log('Audio level:', Math.round(average));
}, 1000);
```

## 🎯 Expected Console Output

### During Call Setup
```
[WebRTC] 🎥 Requesting media...
[WebRTC] ✅ Got local stream: audio: Microphone, video: Camera
[WebRTC] 📞 Initiating call to room: XXXXX
[WebRTC] 🔗 Creating RTCPeerConnection...
[WebRTC] 📤 Adding local stream tracks:
  - Adding audio track: Microphone enabled: true
  - Adding video track: Camera enabled: true
[WebRTC] 📤 Creating WebRTC offer...
[WebRTC] ✅ Offer created, setting local description
[WebRTC] 📤 Sending offer to remote peer
[WebRTC] 🧊 Sending ICE candidate: host
```

### When Remote Connects
```
[WebRTC] 📥 Received WebRTC answer
[WebRTC] 📥 Setting remote description (answer)
[WebRTC] ✅ Remote description set successfully
[WebRTC] 📥 Received remote track: audio Stream ID: xxxxx
   Track details: enabled=true, muted=false, readyState=live
[WebRTC] 🔊 AUDIO TRACK RECEIVED - forcing enabled
   Audio track label: audio_label_xxxxx
   Audio track settings: {sampleRate: 48000, channelCount: 1, ...}
[WebRTC] ✅ Added audio track to remote stream. Total tracks: 1
[WebRTC] 📥 Received remote track: video Stream ID: xxxxx
[WebRTC] ✅ Added video track to remote stream. Total tracks: 2
[WebRTC] 📺 Displaying remote stream...
[WebRTC] 📺 Remote stream tracks: 1 video, 1 audio
[WebRTC] 🔊 Audio track 0: audio_label_xxxxx
   - enabled: true
   - muted: false
   - readyState: live
   - settings: {...}
[WebRTC] 🔊 Video element audio settings: muted=false, volume=1
[WebRTC] ✅ Remote video playing successfully
[WebRTC] 🔊 Remote video muted: false, volume: 1
[WebRTC] 🔊 Audio tracks: 1, Video tracks: 1
[WebRTC] ⏱️ Call timer started
[WebRTC] 🔌 Connection state: connected
[WebRTC] ✅ Peer connection established successfully
```

## ❌ Common Issues & Solutions

### Issue: "No audio from remote user"
**Solution 1**: Check browser console for logs
```javascript
// If you see "Remote video autoplay blocked"
// User needs to click/tap screen to enable audio
```

**Solution 2**: Force unmute
```javascript
document.getElementById('remoteVideoElement').muted = false;
document.getElementById('remoteVideoElement').volume = 1;
```

**Solution 3**: Check permissions
```
Browser must have microphone permission granted
Check: Settings > Privacy > Microphone
```

### Issue: "Timer not running"
**Check console for**:
```
[WebRTC] ⏱️ Call timer started
```

**If missing**:
```javascript
// Manually start timer
webrtcHandler.startCallTimer();
```

### Issue: "Connection fails on mobile"
**Solutions**:
1. Ensure HTTPS (Railway auto-provides)
2. Grant camera/mic permissions
3. Tap screen to trigger audio (autoplay policy)
4. Check if WebRTC supported: `navigator.mediaDevices !== undefined`

### Issue: "No video but audio works"
**Check**:
```javascript
const video = document.getElementById('remoteVideoElement');
console.log('Video tracks:', video.srcObject?.getVideoTracks());
// Should show at least 1 track
```

### Issue: "Echo during call"
**Causes**:
- Both users on same device (test properly)
- Speaker too loud near microphone
- Echo cancellation disabled

**Solution**:
```javascript
// Check echo cancellation
const constraints = {
    audio: {
        echoCancellation: true, // ✅ Must be true
        noiseSuppression: true,
        autoGainControl: true
    }
};
```

## 🚀 Deployment Verification

### After deploying to Railway:

1. **Open deployed URL**
2. **Open browser console (F12)**
3. **Create room**
4. **Expected logs**:
```
[WebRTC] My color assigned: #FF6B6B
Socket connected to room
```

5. **Start video call**
6. **Expected logs**:
```
[WebRTC] 🎥 Requesting media...
[WebRTC] ✅ Got local stream...
[WebRTC] 🔗 Creating RTCPeerConnection...
...full log sequence as above...
```

7. **Join from second device**
8. **Expected result**:
   - ✅ Video visible both sides
   - ✅ Audio audible both sides  
   - ✅ Timer running
   - ✅ Console shows connection logs

## 📊 Success Criteria

### ✅ Call is Working If:
- [ ] Console shows `[WebRTC]` logs
- [ ] Console shows `🔊 AUDIO TRACK RECEIVED`
- [ ] Console shows `✅ Remote video playing successfully`
- [ ] Console shows `⏱️ Call timer started`
- [ ] Timer display updates every second (00:01, 00:02, ...)
- [ ] Video element: `muted = false`
- [ ] Video element: `volume = 1`
- [ ] Audio tracks: `enabled = true`, `readyState = live`
- [ ] Connection state: `connected`
- [ ] You can SEE remote video
- [ ] You can HEAR remote audio
- [ ] Remote user can HEAR you

## 🔧 Emergency Fixes

### If audio still not working after all fixes:

```javascript
// Nuclear option: Force everything
const video = document.getElementById('remoteVideoElement');
const stream = video.srcObject;

// Unmute video element
video.muted = false;
video.volume = 1.0;

// Enable all audio tracks
stream.getAudioTracks().forEach(track => {
    track.enabled = true;
    console.log('Audio track:', track.label, 'enabled:', track.enabled);
});

// Force play
video.play()
    .then(() => console.log('✅ Audio should work now'))
    .catch(e => {
        console.error('Still blocked:', e);
        alert('Please tap screen to enable audio');
    });
```

## 📱 Mobile-Specific Issues

### iOS Safari:
- Requires `playsinline` attribute ✅ (added)
- Requires user interaction for audio ✅ (added notification)
- May need Settings > Safari > Experimental Features > WebRTC enabled

### Android Chrome:
- Usually works with current fixes
- If not, check Site Settings > Camera/Microphone permissions

## 🎉 Final Verification

Run this in console on BOTH devices during a call:

```javascript
// Comprehensive status check
const video = document.getElementById('remoteVideoElement');
const stream = video.srcObject;

console.log('=== CALL STATUS ===');
console.log('Video Element:', {
    muted: video.muted,
    volume: video.volume,
    paused: video.paused,
    currentTime: video.currentTime,
    readyState: video.readyState
});

console.log('Stream:', {
    active: stream?.active,
    id: stream?.id,
    audioTracks: stream?.getAudioTracks().length,
    videoTracks: stream?.getVideoTracks().length
});

stream?.getAudioTracks().forEach((track, i) => {
    console.log(`Audio Track ${i}:`, {
        label: track.label,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
        settings: track.getSettings()
    });
});

console.log('WebRTC:', {
    timerRunning: !!webrtcHandler?.callTimerInterval,
    connectionState: webrtcHandler?.peerConnection?.connectionState,
    iceConnectionState: webrtcHandler?.peerConnection?.iceConnectionState
});
console.log('===================');
```

**Expected output on working call**:
```
=== CALL STATUS ===
Video Element: {muted: false, volume: 1, paused: false, ...}
Stream: {active: true, audioTracks: 1, videoTracks: 1}
Audio Track 0: {enabled: true, muted: false, readyState: "live", ...}
WebRTC: {timerRunning: true, connectionState: "connected", ...}
===================
```

---

## ✅ Summary

All critical bugs fixed:
1. ✅ Infinite recursion in logging
2. ✅ Debug mode enabled
3. ✅ Audio track monitoring added
4. ✅ TURN servers configured
5. ✅ Timer logging enhanced
6. ✅ Comprehensive audio diagnostics
7. ✅ User interaction notification

**The calling feature should now work perfectly after deployment!** 🚀
