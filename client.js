// Initialize Socket.io connection with optimized settings
window.socket = io({
  transports: ['websocket', 'polling'],
  upgrade: true,
  rememberUpgrade: true,
  reconnection: true,
  reconnectionDelay: 500,
  reconnectionAttempts: 10,
  timeout: 10000,
  forceNew: false,
  multiplex: true
});

window.currentUser = 'User_' + Math.random().toString(36).substr(2, 5);
window.currentChat = null;

const socket = window.socket;
const currentUser = window.currentUser;

// Message queue for offline mode
const messageQueue = [];
let isOnline = false;

// Process queued messages when reconnected
function processMessageQueue() {
  while (messageQueue.length > 0 && isOnline) {
    const queuedMessage = messageQueue.shift();
    socket.emit('sendMessage', queuedMessage);
  }
}

// Detect page refresh/unload and clear chat for all users in room
window.addEventListener('beforeunload', () => {
  if (window.socket && window.socket.roomCode) {
    // Silently notify server to clear chat for this room
    window.socket.emit('clearRoomChat', { 
      roomCode: window.socket.roomCode,
      username: window.currentUser 
    });
  }
});

// Connection status
socket.on('connect', () => {
  isOnline = true;
  if (typeof window.updateConnectionStatus === 'function') {
    window.updateConnectionStatus('online');
  }
  processMessageQueue();
});

socket.on('disconnect', () => {
  isOnline = false;
  if (typeof window.updateConnectionStatus === 'function') {
    window.updateConnectionStatus('offline');
  }
});

socket.on('connect_error', (error) => {
  isOnline = false;
  console.error('Connection error:', error.message);
});

// Rate limit exceeded handler
socket.on('rate-limit-exceeded', (data) => {
  if (typeof window.showNotification === 'function') {
    window.showNotification(data.message, 'warning');
  }
});

// Connect to server
socket.emit('join', currentUser);

// Send message with queue support
window.sendMessageWithQueue = function(messageData) {
  if (isOnline) {
    socket.emit('sendMessage', messageData);
  } else {
    messageQueue.push(messageData);
    if (typeof window.showNotification === 'function') {
      window.showNotification('Message queued - will send when reconnected', 'info');
    }
  }
};

// Receive messages
socket.on('newMessage', (message) => {
  displayMessage(message);
});

// User status updates
socket.on('userStatus', (data) => {
  console.log(`${data.username} is ${data.online ? 'online' : 'offline'}`);
});

// Room events
socket.on('roomCreated', (data) => {
  document.getElementById('waitingText').textContent = 'Waiting for someone to join...';
  
  if (typeof window.updateRoomInfo === 'function') {
    window.updateRoomInfo(data.roomCode, data.color, Object.keys(data.participants || {}).length);
  }
});

socket.on('userJoinedRoom', (data) => {
  document.getElementById('waitingText').textContent = 'Connected! 🎉';
  
  if (typeof window.updateConnectionStatus === 'function') {
    window.updateConnectionStatus('online');
  }
  
  if (typeof window.updateRoomInfo === 'function' && data.participants) {
    window.updateRoomInfo(data.roomCode, data.color, Object.keys(data.participants).length);
  }
  
  // Enable call buttons when someone joins the room
  if (typeof window.enableCallButtons === 'function') {
    window.enableCallButtons();
  }
  
  setTimeout(() => {
    const modal = document.getElementById('roomModal');
    if (modal) {
      modal.classList.remove('active');
      document.getElementById('createView').style.display = 'none';
      document.getElementById('joinView').style.display = 'none';
      document.querySelector('.modal-options').style.display = 'grid';
    }
    if (typeof window.openChat === 'function') {
      window.openChat(data.username || 'User');
    }
  }, 1000);
});

socket.on('roomJoined', async (data) => {
  if (typeof window.updateRoomInfo === 'function') {
    window.updateRoomInfo(data.roomCode, data.color, Object.keys(data.participants || {}).length);
  }
  
  if (typeof window.updateConnectionStatus === 'function') {
    window.updateConnectionStatus('online');
  }
  
  // Enable call buttons when room is joined
  if (typeof window.enableCallButtons === 'function') {
    window.enableCallButtons();
  }
  
  const modal = document.getElementById('roomModal');
  if (modal) {
    modal.classList.remove('active');
    document.getElementById('createView').style.display = 'none';
    document.getElementById('joinView').style.display = 'none';
    document.querySelector('.modal-options').style.display = 'grid';
  }
  if (typeof window.openChat === 'function') {
    window.openChat(data.roomCode ? 'Room: ' + data.roomCode : 'Chat Room');
  }
});

socket.on('roomNotFound', () => {
  alert('Room not found. Please check the code.');
});

socket.on('participant-left', (data) => {
  if (typeof window.updateRoomInfo === 'function' && data.participants) {
    window.updateRoomInfo(data.roomCode, null, Object.keys(data.participants).length);
  }
});

socket.on('clearChat', (data) => {
  const messagesArea = document.querySelector('.messages-area');
  if (messagesArea) {
    messagesArea.innerHTML = '<div class="date-divider"><span>Today</span></div>';
  }
});

// Load chat history (messages not stored on server)
async function loadMessages(chatId) {
  const messagesArea = document.querySelector('.messages-area');
  if (messagesArea) {
    messagesArea.innerHTML = '<div class="date-divider"><span>Today</span></div>';
  }
}

async function displayMessage(message) {
  const messagesArea = document.querySelector('.messages-area');
  if (!messagesArea) return;
  
  const messageDiv = document.createElement('div');
  const isSent = message.sender === currentUser;
  messageDiv.className = isSent ? 'message sent' : 'message received';
  
  const messageText = message.text || '[Message]';
  const time = new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  messageDiv.innerHTML = `<div class="message-content"><p>${messageText}</p><span class="message-time">${time}</span></div>`;
  messagesArea.appendChild(messageDiv);
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

window.loadMessages = loadMessages;
window.openChat = openChat;
