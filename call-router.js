// Unified Call Handler - HD Stream Mode Only (WebRTC Disabled)

let useStreamMode = true; // Always use HD Stream

function toggleStreamMode(enabled) {
    // HD Stream mode always enabled - WebRTC disabled
    useStreamMode = true;
    console.log('🎥 HD Stream Mode Active (WebRTC disabled)');
    
    // Show notification
    const notification = document.createElement('div');
    notification.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#0066CC;color:white;padding:15px 25px;border-radius:10px;z-index:10000;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
    notification.textContent = '🎥 HD Stream Mode Active (Recording + Live Streaming)';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Override global call functions to route to correct handler
const originalStartVideoCall = window.startVideoCall;
const originalStartAudioCall = window.startAudioCall;

window.startVideoCall = function() {
    // Always use HD Stream mode (WebRTC disabled)
    console.log('🎥 Starting HD video stream (recording + live)...');
    if (window.startVideoCallStream) {
        window.startVideoCallStream();
    } else {
        console.error('❌ Stream handler not loaded');
        alert('Stream mode not ready. Please refresh the page.');
    }
};

window.startAudioCall = function() {
    // Always use HD Stream mode (WebRTC disabled)
    console.log('🎤 Starting HD audio stream (recording + live)...');
    if (window.startAudioCallStream) {
        window.startAudioCallStream();
    } else {
        console.error('❌ Stream handler not loaded');
        alert('Stream mode not ready. Please refresh the page.');
    }
};

// Override end call - HD Stream only
window.endCall = function() {
    if (window.endStreamCall) {
        window.endStreamCall();
    }
};

// Override mute/video toggles - HD Stream only
window.toggleMute = function() {
    if (window.toggleStreamMute) {
        window.toggleStreamMute();
    }
};

window.toggleVideo = function() {
    if (window.toggleStreamVideo) {
        window.toggleStreamVideo();
    }
};

console.log('✅ HD Stream mode active - WebRTC disabled (Recording + Live Streaming)');
