// WebRTC Handler for Video and Audio Calls with Group Support
class WebRTCHandler {
    constructor() {
        // Debug mode (set to false in production)
        this.DEBUG = true;
        
        // Group call support - mesh network
        this.peerConnections = new Map();
        this.remoteStreams = new Map();
        this.participants = new Map();
        
        // Legacy single peer support
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        
        this.callType = null;
        this.isCallActive = false;
        this.isCaller = false;
        this.remoteUserName = null;
        this.currentFacingMode = 'user';
        this.mySocketId = null;
        this.myColor = null;
        
        // Connection quality monitoring
        this.connectionQuality = new Map();
        this.qualityCheckInterval = null;
        
        // Call timer
        this.callStartTime = null;
        this.callTimerInterval = null;
        
        // STUN servers configuration
        this.configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' },
                { urls: 'stun:stun.services.mozilla.com' },
                { urls: 'stun:stun.stunprotocol.org:3478' },
                // Google's free TURN servers for better connectivity
                {
                    urls: 'turn:openrelay.metered.ca:80',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                },
                {
                    urls: 'turn:openrelay.metered.ca:443',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                },
                {
                    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                }
            ],
            iceCandidatePoolSize: 10,
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require',
            iceTransportPolicy: 'all'
        };

        this.pendingIceCandidates = {};
        this.iceGatheringComplete = false;
        this.iceCandidateBatch = null;
        this.iceBatchTimeout = null;

        this.setupSocketListeners();
    }
    
    log(...args) {
        if (this.DEBUG) console.log('[WebRTC]', ...args);
    }
    
    warn(...args) {
        if (this.DEBUG) console.warn('[WebRTC]', ...args);
    }
    
    error(...args) {
        console.error('[WebRTC ERROR]', ...args); // Always log errors
    }

    setupSocketListeners() {
        if (!window.socket) {
            this.error('Socket not initialized');
            return;
        }

        // Listen for room creation/join events
        window.socket.on('roomCreated', (data) => {
            this.mySocketId = window.socket.id;
            this.myColor = data.color;
            this.updateParticipants(data.participants);
            this.log(`🎨 My color assigned: ${this.myColor}`);
        });

        window.socket.on('roomJoined', (data) => {
            this.mySocketId = window.socket.id;
            this.myColor = data.color;
            this.updateParticipants(data.participants);
            this.log(`🎨 My color assigned: ${this.myColor}`);
        });

        window.socket.on('userJoinedRoom', (data) => {
            this.log(`👤 User joined room: ${data.username}`);
            this.updateParticipants(data.participants);
            
            // If in active call, establish connection with new participant
            if (this.isCallActive) {
                this.connectToNewParticipant(data.socketId);
            }
        });

        window.socket.on('participant-left', (data) => {
            this.log(`👋 Participant left: ${data.username}`);
            this.removeParticipant(data.socketId);
            this.updateParticipants(data.participants);
        });

        // Listen for incoming calls
        window.socket.on('incoming-call', (data) => {
            this.handleIncomingCall(data);
        });

        // Listen for participant joining call
        window.socket.on('participant-joined-call', (data) => {
            this.handleParticipantJoinedCall(data);
        });

        // Listen for call acceptance
        window.socket.on('call-accepted', (data) => {
            this.handleCallAccepted(data);
        });

        // Listen for call rejection
        window.socket.on('call-rejected', (data) => {
            this.handleCallRejected(data);
        });

        // Listen for WebRTC offer
        window.socket.on('webrtc-offer', (data) => {
            this.handleOffer(data.offer, data.fromSocketId);
        });

        // Listen for WebRTC answer
        window.socket.on('webrtc-answer', (data) => {
            this.handleAnswer(data.answer, data.fromSocketId);
        });

        // Listen for ICE candidates
        window.socket.on('webrtc-ice-candidate', (data) => {
            this.handleIceCandidate(data.candidate, data.fromSocketId);
        });

        // Listen for call end
        window.socket.on('call-ended', (data) => {
            this.endCall();
        });
    }

    // Update participants list
    updateParticipants(participants) {
        if (!participants) return;
        
        this.participants.clear();
        for (const [socketId, info] of Object.entries(participants)) {
            this.participants.set(socketId, info);
        }
        
        this.log(`👥 Updated participants: ${this.participants.size} total`);
        this.updateParticipantsList();
    }

    // Update participants UI
    updateParticipantsList() {
        const container = document.getElementById('participantsList');
        if (!container) return;

        container.innerHTML = '';
        let index = 1;
        
        for (const [socketId, info] of this.participants.entries()) {
            const isMe = socketId === this.mySocketId;
            const div = document.createElement('div');
            div.className = 'participant-item';
            div.style.cssText = `
                display: flex;
                align-items: center;
                padding: 8px 12px;
                margin: 4px 0;
                background: rgba(255,255,255,0.05);
                border-radius: 8px;
                border-left: 4px solid ${info.color};
            `;
            
            div.innerHTML = `
                <div style="
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: ${info.color};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 14px;
                    margin-right: 10px;
                ">${index}</div>
                <div style="flex: 1; color: white;">
                    <div style="font-weight: 500;">${info.username}${isMe ? ' (You)' : ''}</div>
                    <div style="font-size: 11px; opacity: 0.7;">Participant ${index}</div>
                </div>
            `;
            
            container.appendChild(div);
            index++;
        }
    }

    // Initiate a call (video or audio)
    async initiateCall(callType) {
        // Check if socket is connected
        if (!window.socket || !window.socket.connected) {
            alert('Not connected to server. Please refresh the page.');
            return;
        }

        // Auto-create a room if not already in one
        if (!window.socket.roomCode) {
            this.log('⚠️ No room joined, creating automatic room for call...');
            const autoRoomCode = 'CALL_' + Math.random().toString(36).substr(2, 6).toUpperCase();
            
            // Create room and wait for confirmation
            window.socket.emit('createRoom', autoRoomCode);
            window.socket.roomCode = autoRoomCode;
            
            // Show brief notification
            const notification = document.createElement('div');
            notification.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#0047AB;color:white;padding:15px 25px;border-radius:10px;z-index:10000;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
            notification.textContent = `Room ${autoRoomCode} created. Share this code with others to receive calls.`;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 4000);
            
            this.log('✅ Auto-room created:', autoRoomCode);
        }

        if (this.isCallActive) {
            alert('A call is already in progress!');
            return;
        }

        this.callType = callType;
        this.isCaller = true;
        this.remoteUserName = window.currentChat || 'User'; // Store who we're calling

        try {
            // Get user media based on call type with mobile-optimized constraints
            let constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: callType === 'video' ? {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 },
                    facingMode: 'user'
                } : false
            };

            this.log('🎥 Requesting media with constraints:', constraints);
            
            // Try with ideal constraints first, fallback to basic if fails
            try {
                this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (err) {
                this.warn('⚠️ Failed with ideal constraints, trying basic:', err);
                // Fallback to basic constraints for older devices
                constraints = {
                    audio: true,
                    video: callType === 'video' ? { facingMode: 'user' } : false
                };
                this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            }
            this.log('✅ Got local stream:', this.localStream.getTracks().map(t => `${t.kind}: ${t.label}`));
            
            // Display local stream
            this.displayLocalStream();

            // Check if there's anyone in the room to call
            this.log('📞 Initiating call to room:', window.socket.roomCode);
            
            // Notify the other user
            window.socket.emit('initiate-call', {
                roomCode: window.socket.roomCode,
                callType: callType,
                from: window.currentUser || 'User'
            });

            // Show call UI immediately (even if waiting for recipient)
            this.showCallUI();
            
            // Set a timeout to check if call was answered
            setTimeout(() => {
                if (this.isCaller && this.isCallActive && !this.peerConnection) {
                    this.log('⚠️ No response from recipient after 30s');
                    const statusEl = document.getElementById('callStatus');
                    if (statusEl) {
                        statusEl.textContent = 'No answer. Make sure someone has joined the room: ' + window.socket.roomCode;
                    }
                }
            }, 30000);

        } catch (error) {
            this.error('❌ Error accessing media devices:', error);
            let errorMessage = 'Unable to access camera/microphone. ';
            
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage += 'Please grant permission in your browser settings.';
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMessage += 'No camera or microphone found.';
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage += 'Camera/microphone is already in use by another application.';
            } else {
                errorMessage += error.message;
            }
            
            alert(errorMessage);
        }
    }

    // Handle incoming call notification
    async handleIncomingCall(data) {
        if (this.isCallActive) {
            return;
        }

        this.callType = data.callType;
        this.isCaller = false;
        this.remoteUserName = data.from;

        const notification = document.createElement('div');
        notification.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#00C853;color:white;padding:15px 25px;border-radius:10px;z-index:10000;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
        notification.innerHTML = `ðŸ“ž ${data.callType === 'video' ? 'Video' : 'Audio'} call from ${data.from} - Connecting...`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);

        if (navigator.vibrate) {
            navigator.vibrate(200);
        }

        await this.acceptCall();
    }

    
    async acceptCall() {
        

        try {
            // Get user media with mobile-optimized constraints
            let constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: this.callType === 'video' ? {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 },
                    facingMode: 'user'
                } : false
            };

            this.log('🎥 Accepting call, requesting media with constraints:', constraints);
            
            // Try with ideal constraints first, fallback to basic if fails
            try {
                this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (err) {
                this.warn('⚠️ Failed with ideal constraints, trying basic:', err);
                // Fallback to basic constraints for older devices
                constraints = {
                    audio: true,
                    video: this.callType === 'video' ? { facingMode: 'user' } : false
                };
                this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            }
            
            this.log('✅ Got local stream:', this.localStream.getTracks().map(t => `${t.kind}: ${t.label}`));
            
            // Display local stream
            this.displayLocalStream();

            // Show call UI
            this.showCallUI();

            // Notify caller that call is accepted
            window.socket.emit('accept-call', {
                roomCode: window.socket.roomCode
            });

            // Create peer connection and wait for offer
            this.createPeerConnection();

        } catch (error) {
            this.error('❌ Error accepting call:', error);
            let errorMessage = 'Unable to accept call. ';
            
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage += 'Please grant camera/microphone permission.';
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMessage += 'No camera or microphone found.';
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage += 'Camera/microphone is already in use.';
            } else {
                errorMessage += error.message;
            }
            
            alert(errorMessage);
            this.endCall();
        }
    }

    // Reject incoming call
    rejectCall() {
        

        window.socket.emit('reject-call', {
            roomCode: window.socket.roomCode
        });
    }

    // Handle call acceptance (caller side)
    async handleCallAccepted(data) {
        this.log('✅ Call accepted by remote peer');
        this.isCallActive = true;
        
        // For group calls, establish peer connection with each participant
        if (this.participants.size > 2) {
            // Group call - establish connections with all other participants
            for (const [socketId, info] of this.participants.entries()) {
                if (socketId !== this.mySocketId && !this.peerConnections.has(socketId)) {
                    await this.createPeerConnectionForParticipant(socketId);
                }
            }
        } else {
            // Duo call - use legacy single peer connection
            this.createPeerConnection();

            // Create and send offer
            try {
                this.log('📤 Creating WebRTC offer...');
                
                // Create offer with optimized options for immediate connectivity
                const offer = await this.peerConnection.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: this.callType === 'video',
                    iceRestart: false
                });
                
                this.log('✅ Offer created, setting local description');
                await this.peerConnection.setLocalDescription(offer);

                this.log('📤 Sending offer to remote peer immediately');
                window.socket.emit('webrtc-offer', {
                    roomCode: window.socket.roomCode,
                    offer: offer
                });
                
                this.log('✅ Offer sent - waiting for answer');
            } catch (error) {
                this.error('❌ Error creating offer:', error);
                alert('Failed to establish connection. Please try again.');
                this.endCall();
            }
        }
    }

    // Handle new participant joining an ongoing call
    handleParticipantJoinedCall(data) {
        this.log(`👤 New participant joined call: ${data.username}`);
        this.connectToNewParticipant(data.socketId);
    }

    // Connect to a new participant (create peer connection and offer)
    async connectToNewParticipant(socketId) {
        if (this.peerConnections.has(socketId)) {
            this.log(`Already connected to ${socketId}`);
            return;
        }

        this.log(`🔗 Creating connection to ${socketId}`);
        await this.createPeerConnectionForParticipant(socketId);
        
        // Create and send offer
        try {
            const pc = this.peerConnections.get(socketId);
            const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: this.callType === 'video'
            });
            
            await pc.setLocalDescription(offer);
            
            window.socket.emit('webrtc-offer', {
                roomCode: window.socket.roomCode,
                offer: offer,
                targetSocketId: socketId
            });
            
            this.log(`✅ Offer sent to ${socketId}`);
        } catch (error) {
            this.error(`❌ Error creating offer for ${socketId}:`, error);
        }
    }

    // Create peer connection for specific participant
    async createPeerConnectionForParticipant(socketId) {
        this.log(`🔗 Creating RTCPeerConnection for ${socketId}`);
        
        const pc = new RTCPeerConnection(this.configuration);
        this.peerConnections.set(socketId, pc);
        
        // Add local stream tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                const sender = pc.addTrack(track, this.localStream);
                
                if (track.kind === 'video') {
                    this.applyAdaptiveBitrate(sender);
                }
            });
        }
        
        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                window.socket.emit('webrtc-ice-candidate', {
                    roomCode: window.socket.roomCode,
                    candidate: event.candidate,
                    targetSocketId: socketId
                });
            }
        };
        
        // Handle remote stream
        pc.ontrack = (event) => {
            this.log(`📥 Received track from ${socketId}:`, event.track.kind);
            
            let stream = this.remoteStreams.get(socketId);
            if (!stream) {
                stream = new MediaStream();
                this.remoteStreams.set(socketId, stream);
            }
            
            stream.addTrack(event.track);
            this.displayRemoteStreamForParticipant(socketId, stream);
        };
        
        // Handle connection state
        pc.onconnectionstatechange = () => {
            this.log(`🔌 Connection state with ${socketId}:`, pc.connectionState);
            if (pc.connectionState === 'connected') {
                this.log(`✅ Connected to ${socketId}`);
                this.startQualityMonitoring(socketId, pc);
            } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                this.log(`❌ Connection with ${socketId} closed`);
                this.stopQualityMonitoring(socketId);
                this.removePeerConnection(socketId);
            }
        };
        
        return pc;
    }

    // Remove participant from call
    removeParticipant(socketId) {
        this.removePeerConnection(socketId);
        this.participants.delete(socketId);
        
        // Remove video element if exists
        const videoEl = document.getElementById(`video-${socketId}`);
        if (videoEl) {
            videoEl.parentElement?.remove();
        }
    }

    // Remove peer connection
    removePeerConnection(socketId) {
        const pc = this.peerConnections.get(socketId);
        if (pc) {
            pc.close();
            this.peerConnections.delete(socketId);
        }
        
        const stream = this.remoteStreams.get(socketId);
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            this.remoteStreams.delete(socketId);
        }
    }

    // Display remote stream for specific participant
    displayRemoteStreamForParticipant(socketId, stream) {
        const participant = this.participants.get(socketId);
        if (!participant) return;
        
        // Check if we're in group call mode
        const participantsGrid = document.getElementById('participantsGrid');
        if (participantsGrid) {
            // Group call mode
            let container = document.getElementById(`video-${socketId}`);
            let videoEl;
            
            if (!container) {
                container = document.createElement('div');
                container.id = `video-${socketId}`;
                container.className = 'participant-video-container';
                container.style.cssText = `
                    position: relative;
                    border-radius: 12px;
                    overflow: hidden;
                    background: #000;
                    border: 3px solid ${participant.color};
                `;
                
                videoEl = document.createElement('video');
                videoEl.autoplay = true;
                videoEl.playsInline = true;
                videoEl.style.cssText = `
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                `;
                
                const nameLabel = document.createElement('div');
                nameLabel.style.cssText = `
                    position: absolute;
                    bottom: 10px;
                    left: 10px;
                    background: ${participant.color};
                    color: white;
                    padding: 5px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                `;
                nameLabel.textContent = participant.username;
                
                container.appendChild(videoEl);
                container.appendChild(nameLabel);
                participantsGrid.appendChild(container);
            } else {
                videoEl = container.querySelector('video');
            }
            
            if (videoEl) {
                videoEl.srcObject = stream;
                videoEl.play().catch(e => this.error('Play error:', e));
            }
            
            this.adjustGridLayout();
        } else {
            // Duo call mode - use standard remote video element
            const remoteVideo = document.getElementById('remoteVideoElement');
            if (remoteVideo) {
                remoteVideo.srcObject = stream;
                remoteVideo.play().catch(e => this.error('Play error:', e));
            }
        }
    }

    // Adjust grid layout based on number of participants
    adjustGridLayout() {
        const grid = document.getElementById('participantsGrid');
        if (!grid) return;
        
        const count = this.remoteStreams.size + 1; // +1 for local video
        
        let columns, rows;
        if (count <= 2) {
            columns = 2; rows = 1;
        } else if (count <= 4) {
            columns = 2; rows = 2;
        } else if (count <= 6) {
            columns = 3; rows = 2;
        } else if (count <= 9) {
            columns = 3; rows = 3;
        } else {
            columns = 4; rows = Math.ceil(count / 4);
        }
        
        grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    }

    // Handle call rejection
    handleCallRejected(data) {
        alert('Call was rejected');
        this.endCall();
    }

    // Create RTCPeerConnection
    createPeerConnection() {
        this.log('🔗 Creating RTCPeerConnection with config:', this.configuration);
        this.peerConnection = new RTCPeerConnection(this.configuration);

        // Add local stream tracks to peer connection
        if (this.localStream) {
            this.log('📤 Adding local stream tracks to peer connection:');
            this.localStream.getTracks().forEach(track => {
                this.log(`  - Adding ${track.kind} track:`, track.label, 'enabled:', track.enabled);
                const sender = this.peerConnection.addTrack(track, this.localStream);
                
                // Apply adaptive bitrate for better performance
                if (track.kind === 'video') {
                    this.applyAdaptiveBitrate(sender);
                }
            });
            this.log('✅ All local tracks added to peer connection');
        } else {
            this.warn('⚠️ No local stream available to add to peer connection');
        }

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.log('🧊 Sending ICE candidate:', event.candidate.type);
                window.socket.emit('webrtc-ice-candidate', {
                    roomCode: window.socket.roomCode,
                    candidate: event.candidate
                });
            } else {
                this.log('🧊 All ICE candidates sent');
            }
        };

        // Handle remote stream
        this.peerConnection.ontrack = (event) => {
            this.log('📥 Received remote track:', event.track.kind, 'Stream ID:', event.streams[0]?.id);
            this.log(`   Track details: enabled=${event.track.enabled}, muted=${event.track.muted}, readyState=${event.track.readyState}`);
            
            if (!this.remoteStream) {
                this.remoteStream = new MediaStream();
                this.log('🎬 Created new remote stream');
            }
            
            // Add the track to remote stream
            this.remoteStream.addTrack(event.track);
            this.log(`✅ Added ${event.track.kind} track to remote stream. Total tracks: ${this.remoteStream.getTracks().length}`);
            
            // CRITICAL: Force enable all tracks, especially audio
            event.track.enabled = true;
            
            // If it's an audio track, log additional details
            if (event.track.kind === 'audio') {
                this.log('🔊 AUDIO TRACK RECEIVED - forcing enabled');
                this.log(`   Audio track label: ${event.track.label}`);
                this.log(`   Audio track settings:`, event.track.getSettings());
                
                // Monitor audio track for any mute changes
                event.track.onmute = () => {
                    this.warn('⚠️ Audio track was muted! Re-enabling...');
                    event.track.enabled = true;
                };
                
                event.track.onunmute = () => {
                    this.log('✅ Audio track unmuted');
                };
                
                event.track.onended = () => {
                    this.warn('⚠️ Audio track ended');
                };
            }
            
            // Display remote stream immediately
            this.displayRemoteStream();
            
            // Update call status when we start receiving media
            const callStatus = document.getElementById('callStatus');
            const audioCallStatus = document.getElementById('audioCallStatus');
            if (callStatus) callStatus.textContent = 'Connected';
            if (audioCallStatus) audioCallStatus.textContent = 'Connected';
        };

        // Handle connection state
        this.peerConnection.onconnectionstatechange = () => {
            this.log('🔌 Connection state:', this.peerConnection.connectionState);
            if (this.peerConnection.connectionState === 'connected') {
                this.log('✅ Peer connection established successfully');
            } else if (this.peerConnection.connectionState === 'disconnected' ||
                this.peerConnection.connectionState === 'failed' ||
                this.peerConnection.connectionState === 'closed') {
                this.log('❌ Peer connection closed:', this.peerConnection.connectionState);
                this.endCall();
            }
        };

        // Handle ICE connection state
        this.peerConnection.oniceconnectionstatechange = () => {
            this.log('🧊 ICE connection state:', this.peerConnection.iceConnectionState);
            
            // Handle failed connections quickly
            if (this.peerConnection.iceConnectionState === 'failed') {
                this.log('⚠️ ICE connection failed, attempting restart...');
                this.peerConnection.restartIce();
            }
        };

        // Monitor ICE gathering state for optimization
        this.peerConnection.onicegatheringstatechange = () => {
            this.log('🧊 ICE gathering state:', this.peerConnection.iceGatheringState);
            if (this.peerConnection.iceGatheringState === 'complete') {
                this.iceGatheringComplete = true;
                this.log('✅ ICE gathering complete - connection optimized');
            }
        };

        // Handle signaling state
        this.peerConnection.onsignalingstatechange = () => {
            this.log('📡 Signaling state:', this.peerConnection.signalingState);
        };

        this.isCallActive = true;
    }

    /**
     * Apply adaptive bitrate to video sender for better performance
     */
    async applyAdaptiveBitrate(sender) {
        try {
            const parameters = sender.getParameters();
            
            if (!parameters.encodings || parameters.encodings.length === 0) {
                parameters.encodings = [{}];
            }
            
            // Set adaptive bitrate constraints
            parameters.encodings[0].maxBitrate = 1000000; // 1 Mbps max
            parameters.encodings[0].minBitrate = 150000;  // 150 kbps min
            parameters.encodings[0].maxFramerate = 30;
            parameters.encodings[0].scaleResolutionDownBy = 1;
            
            // Apply degradation preference for adaptive quality
            parameters.degradationPreference = 'maintain-framerate'; // Prioritize smooth video
            
            await sender.setParameters(parameters);
            this.log('✅ Adaptive bitrate applied to video sender');
        } catch (error) {
            this.warn('⚠️ Could not apply adaptive bitrate:', error);
        }
    }

    // Handle WebRTC offer (receiver side)
    async handleOffer(offer, fromSocketId) {
        this.log(`📥 Received WebRTC offer from ${fromSocketId || 'peer'}`);
        
        let pc;
        
        if (fromSocketId && this.participants.size > 2) {
            // Group call - create/get specific peer connection
            pc = this.peerConnections.get(fromSocketId);
            if (!pc) {
                pc = await this.createPeerConnectionForParticipant(fromSocketId);
            }
        } else {
            // Duo call - use legacy single peer connection
            if (!this.peerConnection) {
                this.log('🔗 Creating peer connection (receiver side)');
                this.createPeerConnection();
            }
            pc = this.peerConnection;
        }

        try {
            this.log('📥 Setting remote description (offer)');
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            
            // Process any queued ICE candidates immediately
            await this.processQueuedIceCandidates(pc, fromSocketId);
            
            this.log('📤 Creating answer...');
            const answer = await pc.createAnswer();
            
            this.log('✅ Answer created, setting local description');
            await pc.setLocalDescription(answer);

            this.log('📤 Sending answer to remote peer immediately');
            window.socket.emit('webrtc-answer', {
                roomCode: window.socket.roomCode,
                answer: answer,
                targetSocketId: fromSocketId
            });
            
            this.log('✅ Answer sent - connection should establish quickly');
        } catch (error) {
            this.error('❌ Error handling offer:', error);
            alert('Failed to establish connection. Please try again.');
            this.endCall();
        }
    }

    // Handle WebRTC answer (caller side)
    async handleAnswer(answer, fromSocketId) {
        this.log(`📥 Received WebRTC answer from ${fromSocketId || 'peer'}`);
        
        const pc = fromSocketId ? this.peerConnections.get(fromSocketId) : this.peerConnection;
        
        if (!pc) {
            this.error(`❌ No peer connection found for ${fromSocketId || 'peer'}`);
            return;
        }
        
        try {
            this.log('📥 Setting remote description (answer)');
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            
            // Process any queued ICE candidates immediately
            await this.processQueuedIceCandidates(pc, fromSocketId);
            
            this.log('✅ Remote description set successfully - connection establishing');
        } catch (error) {
            this.error('❌ Error handling answer:', error);
            alert('Failed to complete connection. Please try again.');
            this.endCall();
        }
    }

    // Handle ICE candidate - optimized for immediate addition
    async handleIceCandidate(candidate, fromSocketId) {
        const pc = fromSocketId ? this.peerConnections.get(fromSocketId) : this.peerConnection;
        
        if (pc) {
            try {
                // Check if remote description is set
                if (!pc.remoteDescription) {
                    this.log('⚠️ No remote description yet, queuing ICE candidate');
                    // Queue the candidate for later
                    const key = fromSocketId || 'default';
                    if (!this.pendingIceCandidates[key]) {
                        this.pendingIceCandidates[key] = [];
                    }
                    this.pendingIceCandidates[key].push(candidate);
                    return;
                }
                
                this.log(`🧊 Adding ICE candidate from ${fromSocketId || 'peer'} immediately`);
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
                this.log('✅ ICE candidate added successfully');
            } catch (error) {
                this.error('❌ Error adding ICE candidate:', error);
                // Don't fail the call, just log the error
            }
        } else {
            this.warn(`⚠️ Received ICE candidate but no peer connection for ${fromSocketId || 'peer'}`);
        }
    }
    
    // Process queued ICE candidates after remote description is set
    async processQueuedIceCandidates(pc, socketId) {
        const key = socketId || 'default';
        if (this.pendingIceCandidates[key] && this.pendingIceCandidates[key].length > 0) {
            this.log(`🔄 Processing ${this.pendingIceCandidates[key].length} queued ICE candidates`);
            for (const candidate of this.pendingIceCandidates[key]) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (error) {
                    this.error('❌ Error adding queued ICE candidate:', error);
                }
            }
            this.pendingIceCandidates[key] = [];
            this.log('✅ All queued ICE candidates processed');
        }
    }

    // Display local stream
    displayLocalStream() {
        const localVideo = document.getElementById('localVideoElement');
        if (localVideo && this.localStream) {
            // Set video attributes for better mobile compatibility
            localVideo.setAttribute('playsinline', 'true');
            localVideo.setAttribute('autoplay', 'true');
            localVideo.setAttribute('muted', 'true');
            localVideo.muted = true; // Local video should always be muted
            localVideo.volume = 0; // Ensure no echo
            
            localVideo.srcObject = this.localStream;
            
            // Force play immediately
            const playPromise = localVideo.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        this.log('✅ Local video playing');
                    })
                    .catch(err => {
                        this.warn('⚠️ Local video autoplay failed, will play on user interaction:', err);
                        // Retry on user interaction
                        const playOnInteraction = () => {
                            localVideo.play().catch(e => this.log('Local play retry:', e));
                        };
                        document.addEventListener('click', playOnInteraction, { once: true });
                        document.addEventListener('touchstart', playOnInteraction, { once: true });
                    });
            }
            
            this.log('✅ Local stream displayed:', this.localStream.getTracks().map(t => `${t.kind}: ${t.enabled}`));
        } else {
            this.error('❌ Local video element or stream not found');
        }
    }

    // Display remote stream
    displayRemoteStream() {
        const remoteVideo = document.getElementById('remoteVideoElement');
        if (remoteVideo && this.remoteStream) {
            this.log('📺 Displaying remote stream...');
            
            // Set video attributes for better mobile compatibility
            remoteVideo.setAttribute('playsinline', 'true');
            remoteVideo.setAttribute('autoplay', 'true');
            
            // Check if stream has active tracks
            const videoTracks = this.remoteStream.getVideoTracks();
            const audioTracks = this.remoteStream.getAudioTracks();
            this.log(`📺 Remote stream tracks: ${videoTracks.length} video, ${audioTracks.length} audio`);
            
            // CRITICAL: Force enable ALL audio tracks
            audioTracks.forEach((track, index) => {
                track.enabled = true;
                this.log(`🔊 Audio track ${index}: ${track.label}`);
                this.log(`   - enabled: ${track.enabled}`);
                this.log(`   - muted: ${track.muted}`);
                this.log(`   - readyState: ${track.readyState}`);
                this.log(`   - settings:`, track.getSettings());
            });
            
            // Enable all video tracks
            videoTracks.forEach((track, index) => {
                track.enabled = true;
                this.log(`📹 Video track ${index} enabled: ${track.label}, readyState: ${track.readyState}`);
            });
            
            remoteVideo.srcObject = this.remoteStream;
            
            // CRITICAL: Force unmute and max volume BEFORE play
            remoteVideo.muted = false;
            remoteVideo.volume = 1.0;
            this.log(`🔊 Video element audio settings: muted=${remoteVideo.muted}, volume=${remoteVideo.volume}`);
            
            // Force play with multiple attempts
            const attemptPlay = () => {
                // Re-apply unmute before each play attempt
                remoteVideo.muted = false;
                remoteVideo.volume = 1.0;
                
                const playPromise = remoteVideo.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            this.log('✅ Remote video playing successfully');
                            this.log(`🔊 Remote video muted: ${remoteVideo.muted}, volume: ${remoteVideo.volume}`);
                            this.log(`🔊 Audio tracks: ${audioTracks.length}, Video tracks: ${videoTracks.length}`);
                            
                            // Start call timer IMMEDIATELY
                            if (!this.callTimerInterval) {
                                this.startCallTimer();
                                this.log('⏱️ Call timer started');
                            }
                            
                            // Update UI to show connected
                            const callStatus = document.getElementById('callStatus');
                            const audioStatus = document.getElementById('audioCallStatus');
                            if (callStatus) callStatus.textContent = 'Connected';
                            if (audioStatus) audioStatus.textContent = 'Connected';
                        })
                        .catch(err => {
                            this.warn('⚠️ Remote video autoplay blocked:', err.name, err.message);
                            this.warn('⚠️ Waiting for user interaction to play audio...');
                            
                            // Show user notification
                            const notification = document.createElement('div');
                            notification.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#FF6B6B;color:white;padding:15px 25px;border-radius:10px;z-index:10000;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3);cursor:pointer;';
                            notification.textContent = '🔊 Tap anywhere to enable audio';
                            document.body.appendChild(notification);
                            
                            // Retry after user interaction
                            const retryPlay = () => {
                                notification.remove();
                                remoteVideo.muted = false;
                                remoteVideo.volume = 1.0;
                                remoteVideo.play()
                                    .then(() => {
                                        this.log('✅ Remote video playing after user interaction');
                                        if (!this.callTimerInterval) {
                                            this.startCallTimer();
                                            this.log('⏱️ Call timer started after interaction');
                                        }
                                    })
                                    .catch(e => this.error('❌ Manual play failed:', e));
                            };
                            
                            notification.addEventListener('click', retryPlay);
                            document.addEventListener('click', retryPlay, { once: true });
                            document.addEventListener('touchstart', retryPlay, { once: true });
                            document.addEventListener('touchend', retryPlay, { once: true });
                        });
                }
            };
            
            // Try playing immediately
            attemptPlay();
            
            // Also try after a short delay
            setTimeout(attemptPlay, 500);
            
            this.log('✅ Remote stream set:', this.remoteStream.getTracks().map(t => `${t.kind}: ${t.enabled}`));
        } else {
            this.error('❌ Remote video element or stream not found');
        }
    }

    // Ensure media playback works on mobile browsers (requires user interaction)
    ensureMediaPlayback() {
        const playMedia = () => {
            const localVideo = document.getElementById('localVideoElement');
            const remoteVideo = document.getElementById('remoteVideoElement');
            
            if (localVideo && localVideo.paused) {
                localVideo.muted = true;
                localVideo.volume = 0;
                localVideo.play().catch(e => this.log('Local play:', e.message));
            }
            
            if (remoteVideo && remoteVideo.paused) {
                // CRITICAL: Ensure remote audio is NOT muted
                remoteVideo.muted = false;
                remoteVideo.volume = 1.0;
                
                remoteVideo.play()
                    .then(() => {
                        this.log('✅ Remote video playing after user interaction');
                        this.log(`🔊 Remote audio: muted=${remoteVideo.muted}, volume=${remoteVideo.volume}`);
                        // Start timer after successful playback
                        if (!this.callTimerInterval) {
                            this.startCallTimer();
                        }
                    })
                    .catch(e => this.log('Remote play:', e.message));
            }
        };
        
        // Try to play on any user interaction
        document.addEventListener('click', playMedia, { once: true });
        document.addEventListener('touchstart', playMedia, { once: true });
        document.addEventListener('touchend', playMedia, { once: true });
        
        // Also try immediately
        setTimeout(playMedia, 100);
        
        // Try again after a delay for mobile
        setTimeout(playMedia, 500);
        setTimeout(playMedia, 1000);
    }

    // Show call UI
    showCallUI() {
        const callContainer = document.getElementById('callContainer');
        const videoContainer = document.getElementById('videoCallContainer');
        const audioContainer = document.getElementById('audioCallContainer');
        
        if (callContainer) callContainer.style.display = 'flex';
        
        // Add click listener to ensure video plays on mobile (user interaction required)
        this.ensureMediaPlayback();
        
        // Check if group call (3+ participants)
        const isGroupCall = this.participants.size >= 3;
        
        if (this.callType === 'video') {
            if (isGroupCall) {
                // Show group video UI
                this.showGroupVideoUI();
            } else if (videoContainer) {
                // Show duo video UI
                videoContainer.style.display = 'flex';
                if (audioContainer) audioContainer.style.display = 'none';
                
                const callStatus = document.getElementById('callStatus');
                if (callStatus) callStatus.textContent = 'Connected';
            }
        } else if (this.callType === 'audio') {
            if (isGroupCall) {
                // Show group audio UI
                this.showGroupAudioUI();
            } else if (audioContainer) {
                // Show duo audio UI
                audioContainer.style.display = 'flex';
                if (videoContainer) videoContainer.style.display = 'none';
                
                const audioCallUserName = document.getElementById('audioCallUserName');
                const audioCallStatus = document.getElementById('audioCallStatus');
                
                if (audioCallUserName) {
                    audioCallUserName.textContent = this.remoteUserName || window.currentChat || 'User';
                }
                if (audioCallStatus) {
                    audioCallStatus.textContent = 'Connected';
                }
            }
        }
    }

    // Show group video call UI
    showGroupVideoUI() {
        let groupContainer = document.getElementById('groupCallContainer');
        
        if (!groupContainer) {
            groupContainer = document.createElement('div');
            groupContainer.id = 'groupCallContainer';
            groupContainer.style.cssText = `
                display: flex;
                flex-direction: column;
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: #0a0e27;
                z-index: 10000;
            `;
            
            groupContainer.innerHTML = `
                <div style="flex: 1; padding: 20px; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; color: white;">
                        <div>
                            <h2 style="margin: 0; font-size: 20px;">Group Video Call</h2>
                            <p id="groupCallTimer" style="margin: 5px 0 0 0; font-size: 16px; font-weight: 600; color: #0066CC;">00:00</p>
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <div id="participantsList" style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px; max-height: 300px; overflow-y: auto; min-width: 200px;"></div>
                            <button onclick="webrtcHandler.shareRoomLink()" style="background: #0066CC; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                📎 Share Link
                            </button>
                        </div>
                    </div>
                    <div id="participantsGrid" style="
                        flex: 1;
                        display: grid;
                        gap: 15px;
                        grid-template-columns: repeat(2, 1fr);
                        grid-template-rows: repeat(2, 1fr);
                        min-height: 0;
                    "></div>
                </div>
                <div style="padding: 20px; display: flex; justify-content: center; gap: 15px; background: rgba(0,0,0,0.5);">
                    <button onclick="webrtcHandler.toggleMute()" id="groupMuteBtn" class="call-btn">🎤</button>
                    <button onclick="webrtcHandler.toggleVideo()" id="groupVideoBtn" class="call-btn">📹</button>
                    <button onclick="webrtcHandler.endCall()" class="call-btn end-call">📞</button>
                </div>
            `;
            
            document.body.appendChild(groupContainer);
        }
        
        groupContainer.style.display = 'flex';
        
        // Add local video to grid
        const grid = document.getElementById('participantsGrid');
        if (grid && this.localStream) {
            let localContainer = document.getElementById('video-local');
            if (!localContainer) {
                localContainer = document.createElement('div');
                localContainer.id = 'video-local';
                localContainer.className = 'participant-video-container';
                localContainer.style.cssText = `
                    position: relative;
                    border-radius: 12px;
                    overflow: hidden;
                    background: #000;
                    border: 3px solid ${this.myColor || '#0066CC'};
                `;
                
                const videoEl = document.createElement('video');
                videoEl.autoplay = true;
                videoEl.muted = true;
                videoEl.playsInline = true;
                videoEl.style.cssText = `
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transform: scaleX(-1);
                `;
                videoEl.srcObject = this.localStream;
                
                const nameLabel = document.createElement('div');
                nameLabel.style.cssText = `
                    position: absolute;
                    bottom: 10px;
                    left: 10px;
                    background: ${this.myColor || '#0066CC'};
                    color: white;
                    padding: 5px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                `;
                nameLabel.textContent = 'You';
                
                localContainer.appendChild(videoEl);
                localContainer.appendChild(nameLabel);
                grid.appendChild(localContainer);
            }
        }
        
        this.updateParticipantsList();
        this.adjustGridLayout();
    }

    // Show group audio call UI
    showGroupAudioUI() {
        // Similar to video but with avatar circles instead of video
        this.showGroupVideoUI(); // Reuse the same UI but hide video elements
        
        const grid = document.getElementById('participantsGrid');
        if (grid) {
            grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(150px, 1fr))';
        }
    }

    // Share room link
    shareRoomLink() {
        const roomCode = window.socket?.roomCode;
        if (!roomCode) {
            alert('No active room to share');
            return;
        }
        
        const link = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Join my RAOUFz call',
                text: `Join my video call on RAOUFz!`,
                url: link
            }).catch(err => this.log('Share failed:', err));
        } else {
            navigator.clipboard.writeText(link).then(() => {
                alert(`Room link copied!\n\n${link}\n\nShare this with others to join the call.`);
            }).catch(err => {
                prompt('Copy this link to share:', link);
            });
        }
    }

    // Toggle mute
    toggleMute() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                
                // Update both mute buttons
                const muteBtn = document.getElementById('muteBtn');
                const audioMuteBtn = document.getElementById('audioMuteBtn');
                
                if (muteBtn) {
                    muteBtn.classList.toggle('muted', !audioTrack.enabled);
                }
                if (audioMuteBtn) {
                    audioMuteBtn.classList.toggle('muted', !audioTrack.enabled);
                }
                
                return audioTrack.enabled;
            }
        }
        return true;
    }

    // Toggle video
    toggleVideo() {
        if (this.localStream && this.callType === 'video') {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                const videoBtn = document.getElementById('videoBtn');
                if (videoBtn) {
                    videoBtn.classList.toggle('disabled', !videoTrack.enabled);
                }
                return videoTrack.enabled;
            }
        }
        return true;
    }

    // Flip camera between front and back (mobile only)
    async flipCamera() {
        if (!this.localStream || this.callType !== 'video') {
            this.log('Cannot flip camera: not in video call');
            return;
        }

        try {
            // Toggle facing mode
            this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
            
            this.log(`🔄 Flipping camera to: ${this.currentFacingMode}`);
            
            // Get new stream with flipped camera
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: this.currentFacingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: true
            });
            
            // Get the new video track
            const newVideoTrack = newStream.getVideoTracks()[0];
            
            if (!newVideoTrack) {
                this.error('Failed to get new video track');
                return;
            }
            
            // Find the sender for the old video track
            const sender = this.peerConnection?.getSenders().find(s => s.track?.kind === 'video');
            
            if (sender) {
                // Replace the old track with the new one
                await sender.replaceTrack(newVideoTrack);
                this.log('✅ Replaced video track in peer connection');
            }
            
            // Stop the old video track
            const oldVideoTrack = this.localStream.getVideoTracks()[0];
            if (oldVideoTrack) {
                oldVideoTrack.stop();
            }
            
            // Remove old video track from local stream
            this.localStream.removeTrack(oldVideoTrack);
            
            // Add new video track to local stream
            this.localStream.addTrack(newVideoTrack);
            
            // Update local video display
            const localVideo = document.getElementById('localVideo');
            if (localVideo) {
                localVideo.srcObject = this.localStream;
            }
            
            this.log('✅ Camera flipped successfully');
            
        } catch (error) {
            this.error('❌ Failed to flip camera:', error);
            // Revert facing mode on error
            this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
            alert('Failed to flip camera. This device may not have multiple cameras.');
        }
    }

    // Start call timer
    startCallTimer() {
        if (this.callTimerInterval) return; // Already running
        
        this.callStartTime = Date.now();
        this.callTimerInterval = setInterval(() => {
            this.updateCallTimer();
        }, 1000);
        
        this.log('⏱️ Call timer started');
    }
    
    // Update call timer display
    updateCallTimer() {
        if (!this.callStartTime) return;
        
        const elapsed = Math.floor((Date.now() - this.callStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update video call timer
        const videoTimer = document.getElementById('callTimer');
        if (videoTimer) {
            videoTimer.textContent = timeString;
        }
        
        // Update audio call timer
        const audioTimer = document.getElementById('audioCallTimer');
        if (audioTimer) {
            audioTimer.textContent = timeString;
        }
        
        // Update group call timer
        const groupTimer = document.getElementById('groupCallTimer');
        if (groupTimer) {
            groupTimer.textContent = timeString;
        }
    }
    
    // Stop call timer
    stopCallTimer() {
        if (this.callTimerInterval) {
            clearInterval(this.callTimerInterval);
            this.callTimerInterval = null;
        }
        this.callStartTime = null;
    }

    // End call
    endCall() {
        // Notify other users
        if (this.isCallActive && window.socket && window.socket.roomCode) {
            window.socket.emit('end-call', {
                roomCode: window.socket.roomCode
            });
        }

        // Stop all tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach(track => track.stop());
            this.remoteStream = null;
        }

        // Close all peer connections (group call)
        for (const [socketId, pc] of this.peerConnections.entries()) {
            pc.close();
        }
        this.peerConnections.clear();
        
        // Stop all remote streams
        for (const [socketId, stream] of this.remoteStreams.entries()) {
            stream.getTracks().forEach(track => track.stop());
        }
        this.remoteStreams.clear();

        // Close legacy peer connection (duo call)
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        // Hide call UI
        const callContainer = document.getElementById('callContainer');
        const videoContainer = document.getElementById('videoCallContainer');
        const audioContainer = document.getElementById('audioCallContainer');
        const groupContainer = document.getElementById('groupCallContainer');
        
        if (callContainer) callContainer.style.display = 'none';
        if (videoContainer) videoContainer.style.display = 'none';
        if (audioContainer) audioContainer.style.display = 'none';
        if (groupContainer) groupContainer.style.display = 'none';

        // Clear video elements
        const localVideo = document.getElementById('localVideoElement');
        const remoteVideo = document.getElementById('remoteVideoElement');
        if (localVideo) localVideo.srcObject = null;
        if (remoteVideo) remoteVideo.srcObject = null;

        // Reset state
        this.isCallActive = false;
        this.isCaller = false;
        this.callType = null;
        this.remoteUserName = null;
        
        // Stop call timer
        this.stopCallTimer();
        
        // Stop quality monitoring
        this.stopAllQualityMonitoring();
        
        this.log('✅ Call ended and cleaned up');
    }
    
    // Connection quality monitoring
    startQualityMonitoring(socketId, pc) {
        if (this.qualityCheckInterval) return;
        
        const monitorId = `quality-${socketId}`;
        this.qualityCheckInterval = setInterval(async () => {
            try {
                const stats = await pc.getStats();
                const quality = this.analyzeConnectionStats(stats, socketId);
                this.updateQualityIndicator(socketId, quality);
            } catch (error) {
                this.error('Quality monitoring error:', error);
            }
        }, 3000); // Check every 3 seconds
    }
    
    analyzeConnectionStats(stats, socketId) {
        let quality = { 
            packetLoss: 0, 
            jitter: 0, 
            rtt: 0, 
            bandwidth: 0,
            level: 'good' 
        };
        
        stats.forEach(report => {
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
                const packetsLost = report.packetsLost || 0;
                const packetsReceived = report.packetsReceived || 1;
                quality.packetLoss = (packetsLost / (packetsLost + packetsReceived)) * 100;
                quality.jitter = report.jitter || 0;
            }
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                quality.rtt = (report.currentRoundTripTime || 0) * 1000; // Convert to ms
            }
        });
        
        // Determine quality level
        if (quality.packetLoss > 5 || quality.rtt > 300) {
            quality.level = 'poor';
        } else if (quality.packetLoss > 2 || quality.rtt > 150) {
            quality.level = 'fair';
        }
        
        return quality;
    }
    
    updateQualityIndicator(socketId, quality) {
        this.connectionQuality.set(socketId, quality);
        
        // Update UI if quality indicator element exists
        const indicator = document.getElementById(`quality-${socketId}`);
        if (indicator) {
            indicator.className = `quality-indicator quality-${quality.level}`;
            indicator.title = `RTT: ${quality.rtt.toFixed(0)}ms, Packet Loss: ${quality.packetLoss.toFixed(1)}%`;
        }
        
        // Show warning for poor quality
        if (quality.level === 'poor' && typeof window.showNotification === 'function') {
            window.showNotification('Connection quality is poor', 'warning');
        }
    }
    
    stopQualityMonitoring(socketId) {
        this.connectionQuality.delete(socketId);
    }
    
    stopAllQualityMonitoring() {
        if (this.qualityCheckInterval) {
            clearInterval(this.qualityCheckInterval);
            this.qualityCheckInterval = null;
        }
        this.connectionQuality.clear();
    }
}

// Initialize WebRTC Handler when page loads
let webrtcHandler;

window.addEventListener('DOMContentLoaded', () => {
    // Wait for socket to be ready
    const initWebRTC = () => {
        if (window.socket) {
            webrtcHandler = new WebRTCHandler();
            window.webrtcHandler = webrtcHandler; // Make it globally accessible
            this.log('WebRTC Handler initialized');
        } else {
            setTimeout(initWebRTC, 100);
        }
    };
    initWebRTC();
});

// Global functions for UI buttons
window.startVideoCall = function() {
    if (!window.socket || !window.socket.roomCode) {
        alert('Please create or join a room first before making calls');
        return;
    }
    
    if (window.webrtcHandler) {
        window.webrtcHandler.initiateCall('video');
    } else {
        alert('WebRTC not ready. Please wait.');
    }
};

window.startAudioCall = function() {
    if (!window.socket || !window.socket.roomCode) {
        alert('Please create or join a room first before making calls');
        return;
    }
    
    if (window.webrtcHandler) {
        window.webrtcHandler.initiateCall('audio');
    } else {
        alert('WebRTC not ready. Please wait.');
    }
};

function acceptIncomingCall() {
    if (window.webrtcHandler) {
        window.webrtcHandler.acceptCall();
    }
}

function rejectIncomingCall() {
    if (window.webrtcHandler) {
        window.webrtcHandler.rejectCall();
    }
}

function toggleMuteCall() {
    if (window.webrtcHandler) {
        window.webrtcHandler.toggleMute();
    }
}

function toggleVideoCall() {
    if (window.webrtcHandler) {
        window.webrtcHandler.toggleVideo();
    }
}

function endCurrentCall() {
    if (window.webrtcHandler) {
        window.webrtcHandler.endCall();
    }
}

// Flip camera function for mobile video calls
async function flipCamera() {
    if (window.webrtcHandler) {
        await window.webrtcHandler.flipCamera();
    }
}

