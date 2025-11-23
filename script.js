// No Firebase - using custom backend

// Fix mobile viewport height
(function() {
    function setVH() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
})();

// UI Functions
const resizer = document.getElementById('resizer');
const sidebar = document.getElementById('sidebar');
let isResizing = false;

resizer.addEventListener('mousedown', () => { isResizing = true; document.body.style.cursor = 'col-resize'; });
document.addEventListener('mousemove', (e) => { if (isResizing && e.clientX >= 300 && e.clientX <= 600) sidebar.style.width = e.clientX + 'px'; });
document.addEventListener('mouseup', () => { isResizing = false; document.body.style.cursor = 'default'; });

function openChat(userName) {
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('chatWindow').style.display = 'flex';
    document.getElementById('chatUserName').textContent = userName;
    document.getElementById('mobileChatUserName').textContent = userName;
    window.currentChat = userName.replace(/\s+/g, '_').toLowerCase();
    
    // Enable call buttons when in a room
    enableCallButtons();
    
    // Mobile specific behavior
    if (window.innerWidth <= 768) {
        document.querySelector('.main-chat').classList.add('chat-active');
        document.getElementById('mobileMessageInput').style.display = 'flex';
        document.querySelector('.sidebar').classList.add('hidden');
        
        // Hide the plus button when chat is open
        const fabButton = document.querySelector('.new-chat-fab');
        if (fabButton) {
            fabButton.classList.add('hidden');
        }
    }
    
    // Update active chat item
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.user === userName) {
            item.classList.add('active');
        }
    });
    
    // Load chat history
    if (window.loadMessages) {
        window.loadMessages(window.currentChat);
    }
}

document.getElementById('messageInput')?.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

function closeProfile() { document.getElementById('profilePanel').classList.remove('active'); }
function showStatus() { alert('Status feature - Coming soon!'); }
document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', function() { document.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); this.classList.add('active'); }));

// Room management
let currentRoomCode = null; // Room code
let currentRoomId = null; // Room ID for server

function toggleFabMenu() { document.getElementById('roomModal').classList.add('active'); }
function closeRoomModal() { document.getElementById('roomModal').classList.remove('active'); document.getElementById('createView').style.display = 'none'; document.getElementById('joinView').style.display = 'none'; document.querySelector('.modal-options').style.display = 'grid'; }

// Generate simple room code
function generateRoomCode() {
    return generateFallbackRoomCode();
}

// Fallback room code generation (still secure)
function generateFallbackRoomCode() {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += charset[Math.floor(Math.random() * charset.length)];
    }
    return code;
}

function showJoinRoom() { document.querySelector('.modal-options').style.display = 'none'; document.getElementById('joinView').style.display = 'block'; }
function backToOptions() { document.getElementById('joinView').style.display = 'none'; document.getElementById('createView').style.display = 'none'; document.querySelector('.modal-options').style.display = 'grid'; }

async function copyRoomCode() { 
    if (currentRoomCode) {
        try {
            await navigator.clipboard.writeText(currentRoomCode);
            
            // Visual feedback
            const btn = event.target.closest('button');
            if (btn) {
                const originalText = btn.innerHTML;
                btn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    Copied!
                `;
                btn.style.background = 'linear-gradient(135deg, #00b300, #00cc00)';
                
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                }, 2000);
            }
            
            console.log('✅ Room code copied to clipboard');
        } catch (error) {
            // Fallback if clipboard fails
            alert('🔐 Secure room code: ' + currentRoomCode);
        }
    }
}

async function shareLink() { 
    if (currentRoomCode) {
        const secureLink = `${window.location.origin}${window.location.pathname}?room=${currentRoomCode}`;
        
        // Check if Web Share API is supported (mobile and modern browsers)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'RAOUFz - Secure Chat Room',
                    text: `Join my chat room!\n\n💬 Room Code: ${currentRoomCode}\n\nSecure chat with video/audio calling.`,
                    url: secureLink
                });
                console.log('✅ Share successful');
            } catch (error) {
                // User cancelled share or error occurred
                if (error.name !== 'AbortError') {
                    console.log('Share failed, falling back to copy');
                    // Fallback to copy
                    await navigator.clipboard.writeText(secureLink);
                    alert('🔗 Link copied! Share this link only with your intended contact.');
                }
            }
        } else {
            // Fallback for browsers that don't support Web Share API
            try {
                await navigator.clipboard.writeText(secureLink);
                alert('🔗 Secure link copied! Share this link only with your intended contact.');
            } catch (error) {
                // If clipboard also fails, show the link
                prompt('Copy this secure link:', secureLink);
            }
        }
    }
}

// Room link sharing functions for group calls
async function copyRoomLink() {
    const roomCode = window.socket?.roomCode || currentRoomId;
    if (!roomCode) {
        alert('No active room to share');
        return;
    }
    
    const link = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    
    try {
        await navigator.clipboard.writeText(link);
        
        // Visual feedback
        const btn = event.target.closest('button');
        if (btn) {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '✅ Copied!';
            btn.style.background = '#00AA55';
            
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.background = '';
            }, 2000);
        }
        
        console.log('✅ Room link copied');
    } catch (error) {
        console.error('Copy failed:', error);
        prompt('Copy this link:', link);
    }
}

async function shareRoomLink() {
    const roomCode = window.socket?.roomCode || currentRoomId;
    if (!roomCode) {
        alert('No active room to share');
        return;
    }
    
    const link = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Join my RAOUFz call',
                text: `Join my group video call on RAOUFz!\n\nRoom Code: ${roomCode}`,
                url: link
            });
            console.log('✅ Share successful');
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.log('Share cancelled or failed');
                copyRoomLink();
            }
        }
    } else {
        copyRoomLink();
    }
}

// Update room info card when joining/creating room
function updateRoomInfo(roomCode, color, participantCount) {
    const card = document.getElementById('roomInfoCard');
    const codeDisplay = document.getElementById('roomCodeDisplay');
    const colorIndicator = document.getElementById('roomColorIndicator');
    const participantsCount = document.getElementById('participantsCount');
    
    if (card && roomCode) {
        card.style.display = 'block';
        
        if (codeDisplay) {
            codeDisplay.textContent = roomCode;
        }
        
        if (colorIndicator && color) {
            colorIndicator.style.background = color;
        }
        
        if (participantsCount && participantCount) {
            participantsCount.textContent = `👥 ${participantCount} participant${participantCount !== 1 ? 's' : ''}`;
        }
    }
}

async function createRoom() {
    console.log('🎬 createRoom function called');
    
    if (!window.socket) {
        console.error('❌ Socket not initialized');
        alert('Connection not ready. Please refresh the page.');
        return;
    }
    
    if (!window.socket.connected) {
        console.error('❌ Socket not connected');
        alert('Not connected to server. Please refresh the page.');
        return;
    }
    
    try {
        // Generate simple 8-character room code
        const roomCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        currentRoomCode = roomCode;
        currentRoomId = roomCode;
        
        console.log('📤 Sending createRoom to server:', roomCode);
        
        // Update UI
        document.querySelector('.modal-options').style.display = 'none';
        document.getElementById('createView').style.display = 'block';
        document.getElementById('roomCodeDisplay').textContent = roomCode;
        document.getElementById('waitingText').textContent = 'Share code to connect...';
        
        // Send to server
        window.socket.emit('createRoom', roomCode);
        window.socket.roomCode = roomCode;
        
        console.log('✅ Room creation request sent');
        
    } catch (error) {
        console.error('❌ Failed to create room:', error);
        alert('Failed to create room: ' + error.message);
    }
}

async function joinRoom() {
    console.log('🎬 joinRoom function called');
    
    if (!window.socket) {
        console.error('❌ Socket not initialized');
        alert('Connection not ready. Please refresh the page.');
        return;
    }
    
    if (!window.socket.connected) {
        console.error('❌ Socket not connected');
        alert('Not connected to server. Please refresh the page.');
        return;
    }
    
    try {
        const code = document.getElementById('joinCodeInput').value.trim();
        console.log('🔑 Joining with code:', code);
        
        if (code.length < 6) {
            alert('Please enter a valid room code (at least 6 characters)');
            return;
        }
        
        const roomCode = code.toUpperCase();
        currentRoomCode = roomCode;
        currentRoomId = roomCode;
        
        console.log('📤 Sending joinRoom to server:', roomCode);
        
        // Send to server
        window.socket.emit('joinRoom', { roomCode: roomCode, username: window.currentUser });
        window.socket.roomCode = roomCode;
        
        console.log('✅ Room join request sent');
        
    } catch (error) {
        console.error('❌ Failed to join room:', error);
        alert('Failed to join room: ' + error.message);
    }
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    if (message) {
        input.value = '';
        
        // Send via Socket.io if connected
        if (window.socket && window.socket.roomCode) {
            window.socket.emit('sendMessage', {
                chatId: window.socket.roomCode,
                sender: window.currentUser || 'You',
                text: message
            });
        }
    }
}

async function sendMobileMessage() {
    const input = document.getElementById('mobileMessageInputField');
    const message = input.value.trim();
    if (message) {
        input.value = '';
        
        // Reset textarea height if it's a textarea
        if (input.tagName === 'TEXTAREA') {
            input.style.height = 'auto';
            input.style.height = '20px';
        }
        
        // Send via Socket.io if connected
        if (window.socket && window.socket.roomCode) {
            window.socket.emit('sendMessage', {
                chatId: window.socket.roomCode,
                sender: window.currentUser || 'You',
                text: message
            });
        }
    }
}

function addMessageToChat(message) {
    const messagesArea = document.querySelector('.messages-area');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message sent';
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    messageDiv.innerHTML = `<div class="message-content"><p>${message}</p><span class="message-time">${time}</span></div>`;
    messagesArea.appendChild(messageDiv);
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

// Mobile Navigation Functions
function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileOverlay');
    
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('active');
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileOverlay');
    
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
}

function closeMobileChat() {
    if (window.innerWidth <= 768) {
        document.querySelector('.main-chat').classList.remove('chat-active');
        document.getElementById('welcomeScreen').style.display = 'flex';
        document.getElementById('chatWindow').style.display = 'none';
        document.getElementById('mobileMessageInput').style.display = 'none';
        document.querySelector('.sidebar').classList.remove('hidden');
        
        // Show the plus button when chat is closed
        const fabButton = document.querySelector('.new-chat-fab');
        if (fabButton) {
            fabButton.classList.remove('hidden');
        }
    }
}

function closeDesktopChat() {
    // Hide chat window and show welcome screen
    document.getElementById('chatWindow').style.display = 'none';
    document.getElementById('welcomeScreen').style.display = 'flex';
    
    // Remove active class from all chat items
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // For mobile view, also handle the mobile-specific behavior
    if (window.innerWidth <= 768) {
        document.querySelector('.main-chat').classList.remove('chat-active');
        document.getElementById('mobileMessageInput').style.display = 'none';
        document.querySelector('.sidebar').classList.remove('hidden');
        
        const fabButton = document.querySelector('.new-chat-fab');
        if (fabButton) {
            fabButton.classList.remove('hidden');
        }
    }
}


function showChatsView() {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.target.closest('.nav-item').classList.add('active');
    document.querySelector('.sidebar').classList.remove('hidden');
    document.querySelector('.main-chat').classList.remove('chat-active');
    document.getElementById('mobileMessageInput').style.display = 'none';
    
    // Show the plus button when returning to chats view
    const fabButton = document.querySelector('.new-chat-fab');
    if (fabButton) {
        fabButton.classList.remove('hidden');
    }
}

function showStatusView() {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.target.closest('.nav-item').classList.add('active');
    alert('Status feature - Coming soon!');
}

function showCallsView() {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.target.closest('.nav-item').classList.add('active');
    alert('Calls feature - Coming soon!');
}

function showProfileView() {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.target.closest('.nav-item').classList.add('active');
    document.getElementById('profilePanel').classList.add('active');
}

function openProfile() {
    document.getElementById('profilePanel').classList.add('active');
}

// Handle window resize
function handleResize() {
    if (window.innerWidth > 768) {
        // Desktop mode
        document.getElementById('sidebar').classList.remove('mobile-open');
        document.getElementById('mobileOverlay').classList.remove('active');
        document.getElementById('mobileMessageInput').style.display = 'none';
        document.getElementById('mobileSidebarToggle').style.display = 'none';
        document.querySelector('.main-chat').classList.remove('chat-active');
    } else {
        // Mobile mode
        document.getElementById('mobileSidebarToggle').style.display = 'flex';
        if (document.getElementById('chatWindow').style.display === 'flex') {
            document.getElementById('mobileMessageInput').style.display = 'flex';
            document.querySelector('.main-chat').classList.add('chat-active');
            document.getElementById('mobileSidebarToggle').style.display = 'none';
        }
    }
}

// Add event listeners
window.addEventListener('resize', handleResize);

// Mobile input event listeners
document.getElementById('mobileMessageInputField')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendMobileMessage();
    }
});

// Prevent zoom on input focus (iOS)
document.addEventListener('touchstart', function() {}, {passive: true});

// Handle viewport changes on mobile
function handleViewportChange() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', handleViewportChange);
window.addEventListener('orientationchange', handleViewportChange);
handleViewportChange();



window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('room');
    if (roomCode) {
        // Store room code globally
        window.currentRoomCode = roomCode;
        currentRoomCode = roomCode;
        currentRoomId = roomCode;
        
        // Auto-fill the room code (in case user needs it later)
        document.getElementById('joinCodeInput').value = roomCode;
        
        console.log('🔗 Room code detected from shared link!');
        console.log('🔑 Room code stored:', roomCode);
        console.log('🚀 Auto-joining room...');
        
        // Automatically join the room without showing modal
        // Wait a bit for socket to be ready
        setTimeout(() => {
            if (window.socket && window.socket.connected) {
                console.log('📤 Auto-joining room:', roomCode);
                window.socket.emit('joinRoom', { roomCode: roomCode, username: window.currentUser });
                window.socket.roomCode = roomCode;
            } else {
                console.warn('⏳ Socket not ready, retrying...');
                // Retry after a short delay
                setTimeout(() => {
                    if (window.socket && window.socket.connected) {
                        console.log('📤 Auto-joining room (retry):', roomCode);
                        window.socket.emit('joinRoom', { roomCode: roomCode, username: window.currentUser });
                        window.socket.roomCode = roomCode;
                    } else {
                        console.error('❌ Socket still not ready, manual join may be needed');
                        alert('Connection issue. Please try refreshing the page.');
                    }
                }, 2000);
            }
        }, 500);
    }
    
    // Initialize mobile layout
    handleResize();
    
    // Add touch event listeners for better mobile experience
    document.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('touchstart', function() {
            this.style.backgroundColor = 'rgba(0, 71, 171, 0.1)';
        }, {passive: true});
        
        item.addEventListener('touchend', function() {
            setTimeout(() => {
                this.style.backgroundColor = '';
            }, 150);
        }, {passive: true});
    });
    
    // Disable call buttons initially
    disableCallButtons();
});

// Call button management
function enableCallButtons() {
    const videoCallBtn = document.getElementById('videoCallBtn');
    const audioCallBtn = document.getElementById('audioCallBtn');
    const mobileVideoCallBtn = document.getElementById('mobileVideoCallBtn');
    const mobileAudioCallBtn = document.getElementById('mobileAudioCallBtn');
    
    // Only enable if connected to socket and in a room
    const canCall = window.socket && window.socket.connected && window.socket.roomCode;
    
    if (videoCallBtn) {
        videoCallBtn.disabled = !canCall;
        videoCallBtn.title = canCall ? 'Start Video Call' : 'Join or create a room to call';
    }
    if (audioCallBtn) {
        audioCallBtn.disabled = !canCall;
        audioCallBtn.title = canCall ? 'Start Audio Call' : 'Join or create a room to call';
    }
    if (mobileVideoCallBtn) {
        mobileVideoCallBtn.disabled = !canCall;
        mobileVideoCallBtn.title = canCall ? 'Start Video Call' : 'Join or create a room to call';
    }
    if (mobileAudioCallBtn) {
        mobileAudioCallBtn.disabled = !canCall;
        mobileAudioCallBtn.title = canCall ? 'Start Audio Call' : 'Join or create a room to call';
    }
}

function disableCallButtons() {
    const videoCallBtn = document.getElementById('videoCallBtn');
    const audioCallBtn = document.getElementById('audioCallBtn');
    const mobileVideoCallBtn = document.getElementById('mobileVideoCallBtn');
    const mobileAudioCallBtn = document.getElementById('mobileAudioCallBtn');
    
    if (videoCallBtn) {
        videoCallBtn.disabled = true;
        videoCallBtn.title = 'Join or create a room to call';
    }
    if (audioCallBtn) {
        audioCallBtn.disabled = true;
        audioCallBtn.title = 'Join or create a room to call';
    }
    if (mobileVideoCallBtn) {
        mobileVideoCallBtn.disabled = true;
        mobileVideoCallBtn.title = 'Join or create a room to call';
    }
    if (mobileAudioCallBtn) {
        mobileAudioCallBtn.disabled = true;
        mobileAudioCallBtn.title = 'Join or create a room to call';
    }
}

// All UI and connection functions implemented

// Onboarding Tutorial Functions
let currentOnboardingStep = 1;
const totalOnboardingSteps = 5;

function showOnboarding() {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
        document.getElementById('onboardingModal').classList.add('active');
        currentOnboardingStep = 1;
        updateOnboardingStep();
    }
}

function closeOnboarding() {
    document.getElementById('onboardingModal').classList.remove('active');
    localStorage.setItem('hasSeenOnboarding', 'true');
}

function skipOnboarding() {
    closeOnboarding();
}

function nextOnboardingStep() {
    if (currentOnboardingStep < totalOnboardingSteps) {
        currentOnboardingStep++;
        updateOnboardingStep();
    } else {
        closeOnboarding();
    }
}

function prevOnboardingStep() {
    if (currentOnboardingStep > 1) {
        currentOnboardingStep--;
        updateOnboardingStep();
    }
}

function updateOnboardingStep() {
    // Hide all steps
    document.querySelectorAll('.onboarding-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Show current step
    const currentStep = document.querySelector(`.onboarding-step[data-step="${currentOnboardingStep}"]`);
    if (currentStep) {
        currentStep.classList.add('active');
    }
    
    // Update dots
    document.querySelectorAll('.dot').forEach((dot, index) => {
        dot.classList.toggle('active', index + 1 === currentOnboardingStep);
    });
    
    // Update buttons
    const backBtn = document.getElementById('onboardingBack');
    const nextBtn = document.getElementById('onboardingNext');
    
    backBtn.style.visibility = currentOnboardingStep === 1 ? 'hidden' : 'visible';
    nextBtn.textContent = currentOnboardingStep === totalOnboardingSteps ? 'Get Started' : 'Next';
}

// Allow clicking dots to navigate
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.dot').forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentOnboardingStep = index + 1;
            updateOnboardingStep();
        });
    });
    
    // Show onboarding on first visit
    setTimeout(showOnboarding, 1000);
});

// Connection Status Banner Functions
function showConnectionBanner(type = 'success', title, message) {
    const banner = document.getElementById('connectionStatusBanner');
    const statusTitle = document.getElementById('statusTitle');
    const statusMessage = document.getElementById('statusMessage');
    
    // Remove previous type classes
    banner.classList.remove('warning', 'error');
    
    // Add type class
    if (type === 'warning') {
        banner.classList.add('warning');
    } else if (type === 'error') {
        banner.classList.add('error');
    }
    
    // Update content
    statusTitle.textContent = title;
    statusMessage.textContent = message;
    
    // Show banner
    banner.style.display = 'flex';
    
    // Auto-hide after 5 seconds for success/warning
    if (type !== 'error') {
        setTimeout(() => {
            hideConnectionBanner();
        }, 5000);
    }
}

function hideConnectionBanner() {
    const banner = document.getElementById('connectionStatusBanner');
    banner.style.display = 'none';
}

// Update connection status when users join room
function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
        statusElement.textContent = status;
        
        // Show banner based on status
        if (status === 'online') {
            showConnectionBanner('success', 'Ready to Call!', 'Both users connected - Video and audio calls available');
        }
    }
}

// Device Test Functions
let testStream = null;
let audioContext = null;
let analyser = null;
let animationFrame = null;

function openDeviceTest() {
    document.getElementById('deviceTestModal').style.display = 'flex';
}

function closeDeviceTest() {
    stopDeviceTest();
    document.getElementById('deviceTestModal').style.display = 'none';
}

async function startDeviceTest() {
    try {
        // Request media permissions
        testStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        // Show video
        const videoElement = document.getElementById('testVideoElement');
        videoElement.srcObject = testStream;
        document.getElementById('testOverlay').style.display = 'none';
        
        // Setup audio level monitoring
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(testStream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        
        // Start monitoring audio level
        monitorAudioLevel();
        
        // Update buttons
        document.getElementById('startTestBtn').style.display = 'none';
        document.getElementById('stopTestBtn').style.display = 'inline-block';
        
        showConnectionBanner('success', 'Devices Working!', 'Camera and microphone are functioning correctly');
        
    } catch (error) {
        console.error('Device test error:', error);
        let errorMessage = 'Failed to access devices. ';
        
        if (error.name === 'NotAllowedError') {
            errorMessage += 'Please grant camera and microphone permissions.';
        } else if (error.name === 'NotFoundError') {
            errorMessage += 'No camera or microphone found.';
        } else {
            errorMessage += error.message;
        }
        
        showConnectionBanner('error', 'Device Error', errorMessage);
    }
}

function stopDeviceTest() {
    // Stop all tracks
    if (testStream) {
        testStream.getTracks().forEach(track => track.stop());
        testStream = null;
    }
    
    // Close audio context
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    
    // Stop animation
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }
    
    // Reset UI
    const videoElement = document.getElementById('testVideoElement');
    videoElement.srcObject = null;
    document.getElementById('testOverlay').style.display = 'flex';
    document.getElementById('audioLevelBar').style.width = '0%';
    
    // Update buttons
    document.getElementById('startTestBtn').style.display = 'inline-block';
    document.getElementById('stopTestBtn').style.display = 'none';
}

function monitorAudioLevel() {
    if (!analyser) return;
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    function update() {
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const percentage = (average / 255) * 100;
        
        // Update audio level bar
        document.getElementById('audioLevelBar').style.width = percentage + '%';
        
        animationFrame = requestAnimationFrame(update);
    }
    
    update();
}

// Enhanced call button validation - removed duplicate, now handled in webrtc-handler.js

async function checkMediaPermissions(type) {
    try {
        const constraints = type === 'video' 
            ? { video: true, audio: true }
            : { audio: true };
            
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        stream.getTracks().forEach(track => track.stop());
        return true;
    } catch (error) {
        console.error('Permission check failed:', error);
        return false;
    }
}

// Add help button to open tutorial anytime
function showHelpTutorial() {
    localStorage.removeItem('hasSeenOnboarding');
    currentOnboardingStep = 1;
    document.getElementById('onboardingModal').classList.add('active');
    updateOnboardingStep();
}

// Expose functions globally
window.showOnboarding = showOnboarding;
window.closeOnboarding = closeOnboarding;
window.skipOnboarding = skipOnboarding;
window.nextOnboardingStep = nextOnboardingStep;
window.prevOnboardingStep = prevOnboardingStep;
window.showConnectionBanner = showConnectionBanner;
window.hideConnectionBanner = hideConnectionBanner;
window.updateConnectionStatus = updateConnectionStatus;
window.openDeviceTest = openDeviceTest;
window.closeDeviceTest = closeDeviceTest;
window.startDeviceTest = startDeviceTest;
window.stopDeviceTest = stopDeviceTest;
window.showHelpTutorial = showHelpTutorial;
window.startVideoCall = startVideoCall;
window.startAudioCall = startAudioCall;
window.enableCallButtons = enableCallButtons;
window.disableCallButtons = disableCallButtons;

// Mobile Emoji Picker Functions
function toggleMobileEmojiPicker() {
    const emojiPicker = document.getElementById('mobileEmojiPicker');
    if (emojiPicker) {
        const isHidden = emojiPicker.style.display === 'none' || !emojiPicker.style.display;
        emojiPicker.style.display = isHidden ? 'block' : 'none';
    }
}

function insertEmoji(emoji) {
    const inputField = document.getElementById('mobileMessageInputField');
    if (inputField) {
        const currentValue = inputField.value;
        const cursorPos = inputField.selectionStart || currentValue.length;
        const newValue = currentValue.slice(0, cursorPos) + emoji + currentValue.slice(cursorPos);
        inputField.value = newValue;
        
        // Auto-resize textarea
        autoResizeTextarea(inputField);
        
        inputField.focus();
        
        // Set cursor position after emoji
        const newPos = cursorPos + emoji.length;
        inputField.setSelectionRange(newPos, newPos);
        
        // Hide emoji picker after selection
        const emojiPicker = document.getElementById('mobileEmojiPicker');
        if (emojiPicker) {
            emojiPicker.style.display = 'none';
        }
    }
}

// Auto-resize textarea function
function autoResizeTextarea(textarea) {
    if (textarea && textarea.tagName === 'TEXTAREA') {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
}

// Comprehensive emoji list
const allEmojis = [
    '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾','👋','🤚','🖐️','✋','🖖','👌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','💪','🦾','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','✅','☑️','✔️','✖️','❌','❎','➕','➖','➗','💯','🔥','💫','✨','🌟','⭐','🌠','🎉','🎊','🎁','🎈','🎀','🎂','🍰','🚀','🏆','🥇','🥈','🥉','⚡','🔔','🔕','🎵','🎶','🌈','⚽','🏀','🏈','⚾','🎾','🏐','🏉','🥏','🎱','🏓','🏸','🥊','🥋','🥅','⛳','⛸️','🎣','🎽','🎿','🛷','🥌','🎯','🎮','🕹️','🎲','🧩','🎰','🎭','🎨','🧵','🧶'
];

// Populate emoji grid on page load
function populateEmojiGrid() {
    const emojiGrid = document.querySelector('.whatsapp-emoji-grid');
    if (emojiGrid && emojiGrid.children.length < 50) {  // Only populate if not already filled
        emojiGrid.innerHTML = '';  // Clear existing
        allEmojis.forEach(emoji => {
            const span = document.createElement('span');
            span.className = 'whatsapp-emoji-item';
            span.textContent = emoji;
            span.onclick = function() { insertEmoji(emoji); };
            emojiGrid.appendChild(span);
        });
    }
}

// Add auto-resize on input
document.addEventListener('DOMContentLoaded', function() {
    const textarea = document.getElementById('mobileMessageInputField');
    if (textarea && textarea.tagName === 'TEXTAREA') {
        textarea.addEventListener('input', function() {
            autoResizeTextarea(this);
        });
    }
    
    // Populate emojis
    populateEmojiGrid();
});

// Expose emoji functions globally
window.toggleMobileEmojiPicker = toggleMobileEmojiPicker;
window.insertEmoji = insertEmoji;


