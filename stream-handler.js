// High-Quality Video Streaming Handler (Non-WebRTC)
// Uses MediaRecorder + WebSocket + MediaSource for server-relayed streaming

class StreamHandler {
    constructor() {
        this.ws = null;
        this.mediaRecorder = null;
        this.localStream = null;
        this.remoteMediaSource = null;
        this.remoteSourceBuffer = null;
        this.receivedChunks = [];
        this.isProcessing = false;
        this.peerId = null;
        this.roomCode = null;
        this.streamType = null; // 'video' or 'audio'
        this.isStreaming = false;
        this.receivingStreams = new Map(); // peerId -> MediaSource
        
        // Quality settings
        this.videoConstraints = {
            video: {
                width: { ideal: 1920, max: 1920 },
                height: { ideal: 1080, max: 1080 },
                frameRate: { ideal: 30, max: 60 },
                facingMode: 'user'
            },
            audio: {
                channelCount: 2,
                sampleRate: 48000,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        };
        
        this.audioConstraints = {
            video: false,
            audio: {
                channelCount: 2,
                sampleRate: 48000,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        };
        
        // Codec preference (best quality + browser support)
        this.mimeType = this.getSupportedMimeType();
        
        console.log('🎥 StreamHandler initialized with codec:', this.mimeType);
    }
    
    getSupportedMimeType() {
        const types = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=h264,opus',
            'video/webm'
        ];
        
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                console.log('✅ Using codec:', type);
                return type;
            }
        }
        
        console.warn('⚠️ No preferred codec found, using default');
        return 'video/webm';
    }
    
    async initWebSocket() {
        return new Promise((resolve, reject) => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/stream`;
            
            console.log('🔌 Connecting to stream server:', wsUrl);
            
            this.ws = new WebSocket(wsUrl);
            this.ws.binaryType = 'arraybuffer';
            
            this.ws.onopen = () => {
                console.log('✅ Stream WebSocket connected');
                resolve();
            };
            
            this.ws.onmessage = (event) => {
                this.handleStreamMessage(event);
            };
            
            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                reject(error);
            };
            
            this.ws.onclose = () => {
                console.log('🔌 WebSocket disconnected');
                this.cleanup();
            };
        });
    }
    
    async startStreaming(type = 'video', roomCode) {
        try {
            this.streamType = type;
            this.roomCode = roomCode;
            this.peerId = window.socket?.id || `peer_${Date.now()}`;
            
            console.log(`🎥 Starting ${type} stream in room ${roomCode}`);
            
            // Connect WebSocket
            await this.initWebSocket();
            
            // Join stream room
            this.ws.send(JSON.stringify({
                type: 'join-stream',
                roomCode: roomCode,
                peerId: this.peerId
            }));
            
            // Get user media
            const constraints = type === 'video' ? this.videoConstraints : this.audioConstraints;
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            console.log('✅ Got media stream:', {
                video: this.localStream.getVideoTracks().length,
                audio: this.localStream.getAudioTracks().length
            });
            
            // Display local preview
            const localVideo = document.getElementById('localVideo') || 
                              document.getElementById('localVideoElement');
            if (localVideo) {
                localVideo.srcObject = this.localStream;
                localVideo.muted = true;
                localVideo.play();
            }
            
            // Start recording and streaming
            this.startMediaRecorder();
            
            this.isStreaming = true;
            
            // Show streaming UI
            this.showStreamUI();
            
            // Start call timer
            if (window.webrtcHandler) {
                window.webrtcHandler.startCallTimer();
            }
            
            return true;
        } catch (error) {
            console.error('❌ Failed to start streaming:', error);
            alert(`Failed to access ${type === 'video' ? 'camera' : 'microphone'}: ${error.message}`);
            return false;
        }
    }
    
    startMediaRecorder() {
        try {
            // High quality bitrates
            const options = {
                mimeType: this.mimeType,
                videoBitsPerSecond: 5_000_000, // 5 Mbps for high quality
                audioBitsPerSecond: 256_000    // 256 kbps for audio
            };
            
            this.mediaRecorder = new MediaRecorder(this.localStream, options);
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    this.sendVideoChunk(event.data);
                }
            };
            
            this.mediaRecorder.onerror = (error) => {
                console.error('❌ MediaRecorder error:', error);
            };
            
            // Record in 200ms chunks for low latency
            this.mediaRecorder.start(200);
            
            console.log('✅ MediaRecorder started with options:', options);
        } catch (error) {
            console.error('❌ Failed to start MediaRecorder:', error);
        }
    }
    
    async sendVideoChunk(blob) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('⚠️ WebSocket not ready, skipping chunk');
            return;
        }
        
        try {
            const arrayBuffer = await blob.arrayBuffer();
            this.ws.send(arrayBuffer);
        } catch (error) {
            console.error('❌ Failed to send chunk:', error);
        }
    }
    
    handleStreamMessage(event) {
        // Check if binary (video chunk) or text (control message)
        if (event.data instanceof ArrayBuffer) {
            this.handleVideoChunk(event.data);
        } else {
            try {
                const message = JSON.parse(event.data);
                this.handleControlMessage(message);
            } catch (error) {
                console.error('❌ Failed to parse message:', error);
            }
        }
    }
    
    handleVideoChunk(arrayBuffer) {
        try {
            // Extract header and video data
            const view = new Uint8Array(arrayBuffer);
            const newlineIndex = view.indexOf(10); // '\n'
            
            if (newlineIndex === -1) {
                console.warn('⚠️ Invalid chunk format');
                return;
            }
            
            const headerString = new TextDecoder().decode(view.slice(0, newlineIndex));
            const header = JSON.parse(headerString);
            const videoData = view.slice(newlineIndex + 1);
            
            // Get or create MediaSource for this peer
            if (!this.receivingStreams.has(header.from)) {
                this.createMediaSourceForPeer(header.from);
            }
            
            // Queue chunk for processing
            this.receivedChunks.push({ peerId: header.from, data: videoData });
            this.processChunkQueue();
            
        } catch (error) {
            console.error('❌ Error handling video chunk:', error);
        }
    }
    
    createMediaSourceForPeer(peerId) {
        try {
            if (!MediaSource.isTypeSupported(this.mimeType)) {
                console.error('❌ MediaSource does not support:', this.mimeType);
                return;
            }
            
            const mediaSource = new MediaSource();
            const remoteVideo = document.getElementById('remoteVideo') || 
                               document.getElementById('remoteVideoElement');
            
            if (!remoteVideo) {
                console.error('❌ Remote video element not found');
                return;
            }
            
            remoteVideo.src = URL.createObjectURL(mediaSource);
            
            mediaSource.addEventListener('sourceopen', () => {
                try {
                    const sourceBuffer = mediaSource.addSourceBuffer(this.mimeType);
                    sourceBuffer.mode = 'sequence';
                    
                    sourceBuffer.addEventListener('updateend', () => {
                        this.processChunkQueue();
                    });
                    
                    sourceBuffer.addEventListener('error', (e) => {
                        console.error('❌ SourceBuffer error:', e);
                    });
                    
                    this.receivingStreams.set(peerId, { mediaSource, sourceBuffer });
                    console.log('✅ MediaSource ready for peer:', peerId);
                    
                } catch (error) {
                    console.error('❌ Failed to create SourceBuffer:', error);
                }
            });
            
            mediaSource.addEventListener('sourceended', () => {
                console.log('MediaSource ended for peer:', peerId);
            });
            
            mediaSource.addEventListener('error', (e) => {
                console.error('❌ MediaSource error:', e);
            });
            
        } catch (error) {
            console.error('❌ Failed to create MediaSource:', error);
        }
    }
    
    processChunkQueue() {
        if (this.isProcessing || this.receivedChunks.length === 0) {
            return;
        }
        
        const chunk = this.receivedChunks.shift();
        const streamData = this.receivingStreams.get(chunk.peerId);
        
        if (!streamData || !streamData.sourceBuffer) {
            console.warn('⚠️ No SourceBuffer for peer:', chunk.peerId);
            return;
        }
        
        const { sourceBuffer } = streamData;
        
        if (sourceBuffer.updating) {
            // Put back and try later
            this.receivedChunks.unshift(chunk);
            return;
        }
        
        try {
            this.isProcessing = true;
            sourceBuffer.appendBuffer(chunk.data);
            this.isProcessing = false;
        } catch (error) {
            console.error('❌ Failed to append buffer:', error);
            this.isProcessing = false;
            
            // Clear queue on error
            if (error.name === 'QuotaExceededError') {
                this.receivedChunks = [];
                if (sourceBuffer.buffered.length > 0) {
                    const removeEnd = sourceBuffer.buffered.end(0) - 5;
                    if (removeEnd > 0) {
                        sourceBuffer.remove(0, removeEnd);
                    }
                }
            }
        }
    }
    
    handleControlMessage(message) {
        console.log('📨 Control message:', message);
        
        switch (message.type) {
            case 'peer-joined':
                console.log('✅ Peer joined:', message.peerId);
                this.showNotification(`${message.peerId} joined the call`);
                break;
                
            case 'peer-left':
                console.log('👋 Peer left:', message.peerId);
                this.receivingStreams.delete(message.peerId);
                this.showNotification(`${message.peerId} left the call`);
                break;
                
            case 'peers-list':
                console.log('👥 Current peers:', message.peers);
                break;
                
            case 'peer-quality-change':
                console.log('🎚️ Peer quality changed:', message);
                break;
        }
    }
    
    showStreamUI() {
        const callContainer = document.getElementById('callContainer');
        const videoContainer = document.getElementById('videoCallContainer');
        const audioContainer = document.getElementById('audioCallContainer');
        
        if (callContainer) callContainer.style.display = 'flex';
        
        if (this.streamType === 'video' && videoContainer) {
            videoContainer.style.display = 'flex';
            if (audioContainer) audioContainer.style.display = 'none';
        } else if (this.streamType === 'audio' && audioContainer) {
            audioContainer.style.display = 'flex';
            if (videoContainer) videoContainer.style.display = 'none';
        }
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#0066CC;color:white;padding:15px 25px;border-radius:10px;z-index:10000;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
    
    toggleMute() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                return audioTrack.enabled;
            }
        }
        return true;
    }
    
    toggleVideo() {
        if (this.localStream && this.streamType === 'video') {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                return videoTrack.enabled;
            }
        }
        return true;
    }
    
    endStream() {
        console.log('🛑 Ending stream');
        
        // Notify server
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'leave-stream',
                roomCode: this.roomCode,
                peerId: this.peerId
            }));
        }
        
        this.cleanup();
    }
    
    cleanup() {
        // Stop MediaRecorder
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        this.mediaRecorder = null;
        
        // Stop all tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        
        // Clean up MediaSources
        for (const [peerId, streamData] of this.receivingStreams.entries()) {
            if (streamData.mediaSource.readyState === 'open') {
                streamData.mediaSource.endOfStream();
            }
        }
        this.receivingStreams.clear();
        
        // Close WebSocket
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        
        // Clear video elements
        const localVideo = document.getElementById('localVideo') || 
                          document.getElementById('localVideoElement');
        const remoteVideo = document.getElementById('remoteVideo') || 
                           document.getElementById('remoteVideoElement');
        
        if (localVideo) localVideo.srcObject = null;
        if (remoteVideo) remoteVideo.src = '';
        
        // Hide UI
        const callContainer = document.getElementById('callContainer');
        const videoContainer = document.getElementById('videoCallContainer');
        const audioContainer = document.getElementById('audioCallContainer');
        
        if (callContainer) callContainer.style.display = 'none';
        if (videoContainer) videoContainer.style.display = 'none';
        if (audioContainer) audioContainer.style.display = 'none';
        
        // Stop timer
        if (window.webrtcHandler) {
            window.webrtcHandler.stopCallTimer();
        }
        
        this.receivedChunks = [];
        this.isProcessing = false;
        this.isStreaming = false;
        
        console.log('✅ Cleanup complete');
    }
}

// Initialize global StreamHandler
let streamHandler;

window.addEventListener('DOMContentLoaded', () => {
    streamHandler = new StreamHandler();
    window.streamHandler = streamHandler;
    console.log('✅ StreamHandler ready');
});

// Global functions for UI buttons
window.startVideoCallStream = async function() {
    if (!window.socket || !window.socket.roomCode) {
        alert('Please create or join a room first');
        return;
    }
    
    if (window.streamHandler) {
        const success = await window.streamHandler.startStreaming('video', window.socket.roomCode);
        if (success) {
            console.log('✅ Video stream started');
        }
    }
};

window.startAudioCallStream = async function() {
    if (!window.socket || !window.socket.roomCode) {
        alert('Please create or join a room first');
        return;
    }
    
    if (window.streamHandler) {
        const success = await window.streamHandler.startStreaming('audio', window.socket.roomCode);
        if (success) {
            console.log('✅ Audio stream started');
        }
    }
};

window.endStreamCall = function() {
    if (window.streamHandler) {
        window.streamHandler.endStream();
    }
};

window.toggleStreamMute = function() {
    if (window.streamHandler) {
        const enabled = window.streamHandler.toggleMute();
        const muteBtn = document.getElementById('muteBtn') || document.getElementById('audioMuteBtn');
        if (muteBtn) {
            muteBtn.classList.toggle('muted', !enabled);
        }
    }
};

window.toggleStreamVideo = function() {
    if (window.streamHandler) {
        const enabled = window.streamHandler.toggleVideo();
        const videoBtn = document.getElementById('videoBtn');
        if (videoBtn) {
            videoBtn.classList.toggle('disabled', !enabled);
        }
    }
};
