// Frontend-only version - No backend required

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
    
    try {
        // Generate simple 8-character room code
        const roomCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        currentRoomCode = roomCode;
        currentRoomId = roomCode;
        
        console.log('📤 Room created:', roomCode);
        
        // Update UI
        document.querySelector('.modal-options').style.display = 'none';
        document.getElementById('createView').style.display = 'block';
        document.getElementById('roomCodeDisplay').textContent = roomCode;
        document.getElementById('waitingText').textContent = 'Share code to connect...';
        
        // Generate and display shareable link
        const shareableLink = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
        const linkDisplay = document.getElementById('shareableLinkDisplay');
        if (linkDisplay) {
            linkDisplay.textContent = shareableLink;
        }
        
        console.log('✅ Room created (frontend only)');
        
    } catch (error) {
        console.error('❌ Failed to create room:', error);
        alert('Failed to create room: ' + error.message);
    }
}

async function joinRoom() {
    console.log('🎬 joinRoom function called');
    
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
        
        console.log('✅ Room joined (frontend only):', roomCode);
        
        // Close modal and show success
        closeRoomModal();
        alert('Joined room: ' + roomCode + '\n\nNote: This is frontend-only mode.');
        
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
        
        // Display message locally (frontend-only)
        addMessageToChat(window.currentUser || 'You', message);
        console.log('Message sent (frontend-only):', message);
    }
}

// Helper function to display messages
function addMessageToChat(sender, text) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message sent';
    messageDiv.innerHTML = `
        <div class="message-bubble">
            <div class="message-text">${text}</div>
            <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
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
        
        // Display message locally (frontend-only)
        addMessageToChat(window.currentUser || 'You', message);
        console.log('Mobile message sent (frontend-only):', message);
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
        console.log('✅ Room joined (frontend-only):', roomCode);
        
        // Store room code locally
        currentRoomCode = roomCode;
        currentRoomId = roomCode;
        alert('Joined room: ' + roomCode + '\\n\\nNote: This is frontend-only mode.');
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
    
    // Enable if in a room (frontend-only)
    const canCall = currentRoomCode !== null;
    
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

// ========================================
// SERVERLESS P2P WEBRTC WITH PEERJS
// ========================================

let peer = null;
let currentCall = null;
let localStream = null;
let remoteStream = null;
let isAudioMuted = false;
let isVideoOff = false;
let callStartTime = null;
let callDurationInterval = null;

// Initialize PeerJS when page loads
window.addEventListener('DOMContentLoaded', function() {
    checkForRoomCodeInURL();
});

// Check URL for room code and auto-join INVISIBLY (User B never sees the code)
function checkForRoomCodeInURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('room');
    
    if (roomCode) {
        console.log('🔗 Room code detected in URL - Auto-joining silently...');
        
        // INVISIBLE auto-fill (User B never sees this)
        const joinCodeInput = document.getElementById('joinCodeInput');
        if (joinCodeInput) {
            joinCodeInput.value = roomCode;
        }
        
        // INSTANT automatic join - NO prompts, NO confirmations
        setTimeout(() => {
            // Silently join the room
            joinRoomSilently(roomCode);
        }, 100); // Fraction of a second
    }
}

// Initialize Peer connection
function initializePeer(peerId) {
    return new Promise((resolve, reject) => {
        try {
            // Use PeerJS cloud server (free, no config needed)
            peer = new Peer(peerId, {
                host: '0.peerjs.com',
                port: 443,
                path: '/',
                secure: true,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ]
                }
            });

            peer.on('open', (id) => {
                console.log('✅ Peer connected with ID:', id);
                resolve(id);
            });

            peer.on('error', (error) => {
                console.error('❌ Peer error:', error);
                reject(error);
            });

            // Listen for incoming calls
            peer.on('call', (incomingCall) => {
                console.log('📞 Incoming call from:', incomingCall.peer);
                handleIncomingCall(incomingCall);
            });

            // Listen for connection events
            peer.on('connection', (conn) => {
                console.log('🔗 Data connection established');
                conn.on('data', (data) => {
                    console.log('📨 Received data:', data);
                    if (data.type === 'message') {
                        displayReceivedMessage(data.text);
                    }
                });
            });

        } catch (error) {
            console.error('❌ Failed to initialize peer:', error);
            reject(error);
        }
    });
}

// Updated createRoom function
async function createRoom() {
    console.log('🎬 createRoom function called');
    
    try {
        // Generate 5-digit room code
        const roomCode = Math.floor(10000 + Math.random() * 90000).toString();
        currentRoomCode = roomCode;
        currentRoomId = roomCode;
        
        console.log('📤 Room created:', roomCode);
        
        // Initialize PeerJS with this room code
        await initializePeer(roomCode);
        
        // Update UI
        document.querySelector('.modal-options').style.display = 'none';
        document.getElementById('createView').style.display = 'block';
        document.getElementById('roomCodeDisplay').textContent = roomCode;
        
        // Generate shareable link
        const shareableLink = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
        
        // Create beautiful share message
        const shareMessage = `💬 WELCOME TO RAOUFz 💬

🎉 You're invited to connect!

Just click the link below to instantly connect with your loved ones:

🔗 ${shareableLink}

✨ No login required
✨ Instant connection
✨ Video & Audio calls
✨ Secure messaging

Click and connect now! 💙`;
        
        // Simplified UI - Only 3 options
        document.getElementById('waitingText').innerHTML = `
            <div style="text-align: center;">
                <p style="font-size: 18px; margin-bottom: 20px; color: #00CC66; font-weight: 600;">✅ Room Created!</p>
                <p style="font-size: 14px; color: rgba(255,255,255,0.9); margin-bottom: 25px;">Choose how to share:</p>
                
                <button onclick="copyCode()" style="width: 100%; background: linear-gradient(135deg, #0066CC, #0047AB); color: white; border: none; padding: 15px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 15px; margin-bottom: 12px; box-shadow: 0 4px 15px rgba(0,102,204,0.3); transition: all 0.3s;">
                    📋 Copy Code
                </button>
                
                <button onclick="copyShareLink()" style="width: 100%; background: linear-gradient(135deg, #00AA55, #008844); color: white; border: none; padding: 15px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 15px; margin-bottom: 12px; box-shadow: 0 4px 15px rgba(0,170,85,0.3); transition: all 0.3s;">
                    🔗 Copy Link
                </button>
                
                <button onclick="shareRoomDirectly()" style="width: 100%; background: linear-gradient(135deg, #CC6600, #AA5500); color: white; border: none; padding: 15px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 15px; box-shadow: 0 4px 15px rgba(204,102,0,0.3); transition: all 0.3s;">
                    📤 Share Link
                </button>
                
                <p style="font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 20px;">Waiting for someone to join...</p>
            </div>
        `;
        
        // Store the share message for later
        window.currentShareMessage = shareMessage;
        window.currentShareLink = shareableLink;
        
        // Open a chat window for this room
        setTimeout(() => {
            openChat(`Room ${roomCode}`);
            updateRoomInfoCard(roomCode);
        }, 500);
        
        console.log('✅ Room created successfully (PeerJS P2P)');
        
    } catch (error) {
        console.error('❌ Failed to create room:', error);
        alert('Failed to create room: ' + error.message);
    }
}

// Copy ONLY the room code (User A keeps code authority)
function copyCode() {
    if (currentRoomCode) {
        navigator.clipboard.writeText(currentRoomCode).then(() => {
            showToast('✅ Code copied: ' + currentRoomCode);
        }).catch(err => {
            console.error('Failed to copy:', err);
            prompt('Copy this code:', currentRoomCode);
        });
    }
}

// Copy ONLY the shareable link (User B auto-joins)
function copyShareLink() {
    if (window.currentShareLink) {
        navigator.clipboard.writeText(window.currentShareLink).then(() => {
            showToast('✅ Link copied! Share it to connect instantly.');
        }).catch(err => {
            console.error('Failed to copy:', err);
            prompt('Copy this link:', window.currentShareLink);
        });
    }
}

// Simple toast notification
function showToast(message) {
    // Remove existing toast
    const existingToast = document.querySelector('.custom-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #00AA55, #00CC66);
        color: white;
        padding: 15px 30px;
        border-radius: 50px;
        font-weight: 600;
        font-size: 14px;
        z-index: 100000;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        animation: slideUp 0.3s ease;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// Share via Web Share API
// Share via Web Share API or fallback to copy
function shareRoomDirectly() {
    if (navigator.share && window.currentShareMessage) {
        navigator.share({
            title: '💬 Join my RAOUFz video chat!',
            text: window.currentShareMessage
        }).then(() => {
            console.log('✅ Shared successfully');
            showToast('✅ Shared successfully!');
        }).catch(err => {
            console.log('Share cancelled or failed:', err);
            // Fallback to copy
            copyFullShareMessage();
        });
    } else {
        // Fallback if Web Share API not supported
        copyFullShareMessage();
    }
}

// Copy the full beautiful share message
function copyFullShareMessage() {
    if (window.currentShareMessage) {
        navigator.clipboard.writeText(window.currentShareMessage).then(() => {
            showToast('✅ Share message copied! Paste in WhatsApp, SMS, or any app.');
        }).catch(err => {
            console.error('Failed to copy:', err);
            // Ultimate fallback
            prompt('Copy this message:', window.currentShareMessage);
        });
    } else if (window.currentShareLink) {
        // If message not available, at least copy the link
        copyShareLink();
    }
}

// Update room info card
function updateRoomInfoCard(roomCode, hideCode = false) {
    const roomInfoCard = document.getElementById('roomInfoCard');
    const roomCodeDisplay = document.getElementById('roomCodeDisplay');
    const roomColorIndicator = document.getElementById('roomColorIndicator');
    
    if (roomInfoCard) {
        roomInfoCard.style.display = 'block';
        
        if (hideCode) {
            // User B joined via link - HIDE the code completely
            const codeSection = roomCodeDisplay?.closest('div');
            if (codeSection) {
                codeSection.style.display = 'none';
            }
            // Change title to show they're a guest
            const titleElement = roomInfoCard.querySelector('h3');
            if (titleElement) {
                titleElement.textContent = '🎉 Connected to Room';
            }
        } else {
            // User A created room - SHOW the code
            if (roomCodeDisplay) {
                roomCodeDisplay.textContent = roomCode;
            }
        }
        
        // Random color for this room
        const colors = ['#0066CC', '#00AA55', '#CC6600', '#AA00CC', '#CC0066'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        if (roomColorIndicator) {
            roomColorIndicator.style.background = color;
        }
    }
}

// Copy room link
function copyRoomLink() {
    if (window.currentShareLink) {
        navigator.clipboard.writeText(window.currentShareLink).then(() => {
            alert('✅ Link copied to clipboard!');
        }).catch(err => {
            prompt('Copy this link:', window.currentShareLink);
        });
    }
}

// Share room link
function shareRoomLink() {
    shareRoomDirectly();
}

// Silent join function - NO alerts, NO prompts, INSTANT connection
async function joinRoomSilently(roomCode) {
    console.log('🔗 Silently joining room:', roomCode);
    
    try {
        currentRoomCode = roomCode;
        currentRoomId = roomCode;
        
        // Generate a random peer ID for joiner
        const myPeerId = 'peer-' + Math.random().toString(36).substring(2, 15);
        
        // Initialize PeerJS
        await initializePeer(myPeerId);
        
        // Store the room creator's peer ID (which is the room code)
        window.remotePeerId = roomCode;
        
        console.log('✅ Silently connected to room:', roomCode);
        
        // AUTOMATICALLY open chat (User B sees message section immediately)
        openChat(`Room ${roomCode}`);
        updateRoomInfoCard(roomCode, true); // true = hide code from User B
        
        // Update participants count
        const participantsCount = document.getElementById('participantsCount');
        if (participantsCount) {
            participantsCount.textContent = '👥 2 participants (Connected!)';
        }
        
        // NO alerts - just silently connected!
        console.log('🎉 User B connected silently - ready for calls!');
        
    } catch (error) {
        console.error('❌ Failed to join room silently:', error);
        // Only show error if connection fails
        alert('Connection failed. Please try again.');
    }
}

// Updated joinRoom function (for manual join via code entry)
async function joinRoom() {
    console.log('🎬 joinRoom function called');
    
    try {
        const code = document.getElementById('joinCodeInput').value.trim();
        console.log('🔑 Joining with code:', code);
        
        if (code.length < 5) {
            alert('Please enter a valid 5-digit room code');
            return;
        }
        
        // Use silent join for consistency
        await joinRoomSilently(code);
        
        // Close modal
        closeRoomModal();
        
    } catch (error) {
        console.error('❌ Failed to join room:', error);
        alert('Failed to join room: ' + error.message);
    }
}

// Start Audio Call
async function startAudioCall() {
    try {
        console.log('📞 Starting audio call...');
        
        // Get audio stream only
        localStream = await navigator.mediaDevices.getUserMedia({ 
            audio: true, 
            video: false 
        });
        
        makeCall(false); // false = audio only
        
    } catch (error) {
        console.error('❌ Failed to start audio call:', error);
        alert('Could not access microphone: ' + error.message);
    }
}

// Start Video Call
async function startVideoCall() {
    try {
        console.log('📹 Starting video call...');
        
        // Get audio + video stream
        localStream = await navigator.mediaDevices.getUserMedia({ 
            audio: true, 
            video: { 
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        
        makeCall(true); // true = video enabled
        
    } catch (error) {
        console.error('❌ Failed to start video call:', error);
        alert('Could not access camera/microphone: ' + error.message);
    }
}

// Make the actual call
function makeCall(isVideo) {
    if (!peer) {
        alert('❌ Not connected to signaling server. Please create or join a room first.');
        return;
    }
    
    const targetPeerId = window.remotePeerId || currentRoomCode;
    
    if (!targetPeerId) {
        alert('❌ No peer to call. Make sure you joined a room.');
        return;
    }
    
    console.log('📞 Calling peer:', targetPeerId);
    
    // Make the call
    currentCall = peer.call(targetPeerId, localStream);
    
    if (!currentCall) {
        alert('❌ Failed to initiate call.');
        return;
    }
    
    // Show video UI
    showVideoCallUI(isVideo);
    
    // Display local stream
    const localVideo = document.getElementById('localVideo');
    if (localVideo) {
        localVideo.srcObject = localStream;
        localVideo.style.display = isVideo ? 'block' : 'none';
    }
    
    // Handle incoming stream from remote peer
    currentCall.on('stream', (stream) => {
        console.log('✅ Receiving remote stream');
        remoteStream = stream;
        
        const remoteVideo = document.getElementById('remoteVideo');
        if (remoteVideo) {
            remoteVideo.srcObject = stream;
        }
        
        // Update call status
        updateCallStatus('Connected');
        startCallDuration();
    });
    
    currentCall.on('close', () => {
        console.log('📴 Call ended by remote peer');
        endCall();
    });
    
    currentCall.on('error', (err) => {
        console.error('❌ Call error:', err);
        alert('Call error: ' + err.message);
        endCall();
    });
}

// Handle incoming call
function handleIncomingCall(incomingCall) {
    currentCall = incomingCall;
    
    // Show incoming call modal
    const modal = document.getElementById('incomingCallModal');
    const callerName = document.getElementById('callerName');
    const callType = document.getElementById('callType');
    
    if (modal) {
        modal.style.display = 'flex';
        if (callerName) callerName.textContent = 'Incoming Call';
        if (callType) callType.textContent = 'Video/Audio Call';
    }
    
    // Store the call for answer/reject
    window.pendingCall = incomingCall;
}

// Answer incoming call
async function answerCall() {
    try {
        const incomingCall = window.pendingCall;
        
        if (!incomingCall) {
            alert('❌ No incoming call to answer.');
            return;
        }
        
        // Hide incoming call modal
        document.getElementById('incomingCallModal').style.display = 'none';
        
        // Get user media
        localStream = await navigator.mediaDevices.getUserMedia({ 
            audio: true, 
            video: true 
        });
        
        // Answer the call with our stream
        incomingCall.answer(localStream);
        
        // Show video UI
        showVideoCallUI(true);
        
        // Display local stream
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = localStream;
        }
        
        // Handle remote stream
        incomingCall.on('stream', (stream) => {
            console.log('✅ Receiving remote stream');
            remoteStream = stream;
            
            const remoteVideo = document.getElementById('remoteVideo');
            if (remoteVideo) {
                remoteVideo.srcObject = stream;
            }
            
            updateCallStatus('Connected');
            startCallDuration();
        });
        
        incomingCall.on('close', () => {
            console.log('📴 Call ended');
            endCall();
        });
        
        currentCall = incomingCall;
        
    } catch (error) {
        console.error('❌ Failed to answer call:', error);
        alert('Could not answer call: ' + error.message);
    }
}

// Reject incoming call
function rejectCall() {
    if (window.pendingCall) {
        window.pendingCall.close();
        window.pendingCall = null;
    }
    
    document.getElementById('incomingCallModal').style.display = 'none';
}

// Show video call UI
function showVideoCallUI(showVideo) {
    const container = document.getElementById('videoCallContainer');
    if (container) {
        container.style.display = 'flex';
    }
    
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    
    if (localVideo) {
        localVideo.style.display = showVideo ? 'block' : 'none';
    }
    
    if (remoteVideo) {
        remoteVideo.style.display = 'block';
    }
    
    updateCallStatus('Connecting...');
}

// Update call status
function updateCallStatus(status) {
    const statusEl = document.getElementById('callStatus');
    if (statusEl) {
        statusEl.textContent = status;
    }
}

// Start call duration timer
function startCallDuration() {
    callStartTime = Date.now();
    const durationEl = document.getElementById('callDuration');
    
    if (durationEl) {
        durationEl.style.display = 'block';
        
        callDurationInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            durationEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);
    }
}

// Toggle audio mute
function toggleAudio() {
    if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            isAudioMuted = !isAudioMuted;
            audioTrack.enabled = !isAudioMuted;
            
            const btn = document.getElementById('toggleAudioBtn');
            if (btn) {
                btn.style.background = isAudioMuted ? '#CC0000' : 'rgba(255,255,255,0.2)';
                btn.title = isAudioMuted ? 'Unmute' : 'Mute';
            }
        }
    }
}

// Toggle video
function toggleVideo() {
    if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            isVideoOff = !isVideoOff;
            videoTrack.enabled = !isVideoOff;
            
            const btn = document.getElementById('toggleVideoBtn');
            if (btn) {
                btn.style.background = isVideoOff ? '#CC0000' : 'rgba(255,255,255,0.2)';
                btn.title = isVideoOff ? 'Turn Camera On' : 'Turn Camera Off';
            }
            
            const localVideo = document.getElementById('localVideo');
            if (localVideo) {
                localVideo.style.opacity = isVideoOff ? '0.3' : '1';
            }
        }
    }
}

// End call
function endCall() {
    console.log('📴 Ending call...');
    
    // Stop all media tracks
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        remoteStream = null;
    }
    
    // Close the call
    if (currentCall) {
        currentCall.close();
        currentCall = null;
    }
    
    // Hide video UI
    const container = document.getElementById('videoCallContainer');
    if (container) {
        container.style.display = 'none';
    }
    
    // Clear video elements
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    
    if (localVideo) localVideo.srcObject = null;
    if (remoteVideo) remoteVideo.srcObject = null;
    
    // Stop duration timer
    if (callDurationInterval) {
        clearInterval(callDurationInterval);
        callDurationInterval = null;
    }
    
    // Reset states
    isAudioMuted = false;
    isVideoOff = false;
    callStartTime = null;
    
    console.log('✅ Call ended');
}

// Display received message
function displayReceivedMessage(text) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message received';
    messageDiv.innerHTML = `
        <div class="message-bubble">
            <div class="message-text">${text}</div>
            <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Make functions globally available
window.startAudioCall = startAudioCall;
window.startVideoCall = startVideoCall;
window.answerCall = answerCall;
window.rejectCall = rejectCall;
window.toggleAudio = toggleAudio;
window.toggleVideo = toggleVideo;
window.endCall = endCall;
window.copyRoomLink = copyRoomLink;
window.shareRoomLink = shareRoomLink;
window.shareRoomDirectly = shareRoomDirectly;
window.copyCode = copyCode;
window.copyShareLink = copyShareLink;
window.joinRoomSilently = joinRoomSilently;
window.copyFullShareMessage = copyFullShareMessage;


