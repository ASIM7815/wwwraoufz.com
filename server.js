const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const compression = require('compression');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { 
  cors: { 
    origin: ["*", "https://www.raoufz.com", "https://raoufz.com", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 30000,
  pingInterval: 10000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e8,
  allowEIO3: true
});

// Trust proxy for HTTPS on Render
app.set('trust proxy', 1);

app.use(compression()); // Enable gzip compression
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Redirect www to non-www (optional, or vice versa)
app.use((req, res, next) => {
  const host = req.header('host');
  
  // If using www.raoufz.com, keep it (or redirect to non-www if preferred)
  // For now, accept both www and non-www
  if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    // Force HTTPS redirect
    return res.redirect(301, `https://${host}${req.url}`);
  }
  next();
});

const messages = {};
const users = {};
const rooms = {};

// Rate limiting map: socketId -> { messageCount, lastReset }
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 10000; // 10 seconds
const MAX_MESSAGES_PER_WINDOW = 50; // Max 50 messages per 10 seconds

// Room cleanup configuration
const ROOM_CLEANUP_INTERVAL = 60000; // Check every 60 seconds
const ROOM_INACTIVITY_TIMEOUT = 1800000; // 30 minutes of inactivity

// Color palette for participants (vibrant colors for easy distinction)
const participantColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B195', '#C06C84',
  '#6C5B7B', '#F67280', '#355C7D', '#99B898', '#FECEAB'
];

// Rate limiting helper
function checkRateLimit(socketId) {
  const now = Date.now();
  const limit = rateLimits.get(socketId);
  
  if (!limit) {
    rateLimits.set(socketId, { messageCount: 1, lastReset: now });
    return true;
  }
  
  if (now - limit.lastReset > RATE_LIMIT_WINDOW) {
    rateLimits.set(socketId, { messageCount: 1, lastReset: now });
    return true;
  }
  
  if (limit.messageCount >= MAX_MESSAGES_PER_WINDOW) {
    return false; // Rate limit exceeded
  }
  
  limit.messageCount++;
  return true;
}

// Room cleanup - remove inactive rooms
setInterval(() => {
  const now = Date.now();
  Object.keys(rooms).forEach(roomCode => {
    const room = rooms[roomCode];
    const participantCount = Object.keys(room.participants).length;
    
    // Delete empty rooms older than 5 minutes
    if (participantCount === 0) {
      const roomAge = now - new Date(room.createdAt).getTime();
      if (roomAge > 300000) { // 5 minutes
        console.log(`🗑️ Auto-cleanup: Removing empty room ${roomCode}`);
        delete rooms[roomCode];
      }
    }
    
    // Mark rooms with no recent activity
    if (room.lastActivity) {
      const inactiveTime = now - new Date(room.lastActivity).getTime();
      if (inactiveTime > ROOM_INACTIVITY_TIMEOUT && participantCount === 0) {
        console.log(`🗑️ Auto-cleanup: Removing inactive room ${roomCode}`);
        delete rooms[roomCode];
      }
    }
  });
  
  // Cleanup old rate limit entries
  rateLimits.forEach((value, key) => {
    if (now - value.lastReset > RATE_LIMIT_WINDOW * 2) {
      rateLimits.delete(key);
    }
  });
}, ROOM_CLEANUP_INTERVAL);

app.get('/api/messages/:chatId', (req, res) => {
  // Messages are not stored on server for privacy
  res.json([]);
});

app.get('/api/users', (req, res) => {
  res.json(Object.values(users));
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (username) => {
    socket.username = username;
    users[username] = { username, online: true };
    io.emit('userStatus', { username, online: true });
  });

  socket.on('sendMessage', (data) => {
    // Rate limiting check
    if (!checkRateLimit(socket.id)) {
      socket.emit('rate-limit-exceeded', { 
        message: 'Sending too many messages. Please slow down.' 
      });
      return;
    }
    
    const chatId = data.chatId || socket.roomCode;
    const message = { ...data, timestamp: new Date() };
    
    if (socket.roomCode) {
      // Update room activity
      if (rooms[socket.roomCode]) {
        rooms[socket.roomCode].lastActivity = new Date();
      }
      io.to(socket.roomCode).emit('newMessage', message);
    } else {
      io.emit('newMessage', message);
    }
  });

  socket.on('createRoom', (roomCode) => {
    rooms[roomCode] = { 
      creator: socket.id, 
      participants: {},
      createdAt: new Date(),
      lastActivity: new Date()
    };
    
    const color = participantColors[0];
    rooms[roomCode].participants[socket.id] = {
      socketId: socket.id,
      username: socket.username || 'User',
      color: color,
      joinedAt: new Date()
    };
    
    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.emit('roomCreated', { 
      roomCode, 
      color,
      participants: rooms[roomCode].participants
    });
  });

  socket.on('joinRoom', ({ roomCode, username }) => {
    if (rooms[roomCode]) {
      socket.join(roomCode);
      socket.roomCode = roomCode;
      socket.username = username || 'User';
      
      const participantCount = Object.keys(rooms[roomCode].participants).length;
      const color = participantColors[participantCount % participantColors.length];
      
      rooms[roomCode].participants[socket.id] = {
        socketId: socket.id,
        username: username || 'User',
        color: color,
        joinedAt: new Date()
      };
      rooms[roomCode].lastActivity = new Date();
      
      socket.to(roomCode).emit('userJoinedRoom', { 
        roomCode, 
        username,
        socketId: socket.id,
        color,
        participants: rooms[roomCode].participants
      });
      
      socket.emit('roomJoined', { 
        roomCode,
        color,
        participants: rooms[roomCode].participants
      });
    } else {
      socket.emit('roomNotFound');
    }
  });

  // WebRTC Video/Audio Call Signaling
  socket.on('initiate-call', ({ roomCode, callType, from }) => {
    const room = rooms[roomCode];
    if (room) {
      room.lastActivity = new Date();
      socket.to(roomCode).emit('incoming-call', { 
        callType, 
        from,
        fromSocketId: socket.id,
        roomCode,
        participants: room.participants
      });
    }
  });

  socket.on('join-call', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (room) {
      room.lastActivity = new Date();
      socket.to(roomCode).emit('participant-joined-call', {
        socketId: socket.id,
        username: socket.username || 'User',
        color: room.participants[socket.id]?.color
      });
    }
  });

  socket.on('accept-call', ({ roomCode }) => {
    if (rooms[roomCode]) rooms[roomCode].lastActivity = new Date();
    socket.to(roomCode).emit('call-accepted', { roomCode });
  });

  socket.on('reject-call', ({ roomCode }) => {
    socket.to(roomCode).emit('call-rejected', { roomCode });
  });

  socket.on('webrtc-offer', ({ roomCode, offer, targetSocketId }) => {
    if (rooms[roomCode]) rooms[roomCode].lastActivity = new Date();
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-offer', { 
        offer, 
        fromSocketId: socket.id,
        roomCode 
      });
    } else {
      socket.to(roomCode).emit('webrtc-offer', { 
        offer,
        fromSocketId: socket.id,
        roomCode 
      });
    }
  });

  socket.on('webrtc-answer', ({ roomCode, answer, targetSocketId }) => {
    if (rooms[roomCode]) rooms[roomCode].lastActivity = new Date();
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-answer', { 
        answer,
        fromSocketId: socket.id,
        roomCode 
      });
    } else {
      socket.to(roomCode).emit('webrtc-answer', { 
        answer,
        fromSocketId: socket.id,
        roomCode 
      });
    }
  });

  socket.on('webrtc-ice-candidate', ({ roomCode, candidate, targetSocketId }) => {
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-ice-candidate', { 
        candidate,
        fromSocketId: socket.id,
        roomCode 
      });
    } else {
      socket.to(roomCode).emit('webrtc-ice-candidate', { 
        candidate,
        fromSocketId: socket.id,
        roomCode 
      });
    }
  });

  socket.on('end-call', ({ roomCode }) => {
    socket.to(roomCode).emit('call-ended', { roomCode });
  });

  socket.on('clearRoomChat', ({ roomCode, username }) => {
    io.to(roomCode).emit('clearChat', { roomCode, username });
  });

  socket.on('disconnect', () => {
    if (socket.roomCode && rooms[socket.roomCode]) {
      const room = rooms[socket.roomCode];
      const username = room.participants[socket.id]?.username || 'User';
      
      delete room.participants[socket.id];
      
      io.to(socket.roomCode).emit('participant-left', { 
        socketId: socket.id,
        username: username,
        roomCode: socket.roomCode,
        participants: room.participants
      });
      
      if (Object.keys(room.participants).length === 0) {
        delete rooms[socket.roomCode];
      }
    }
    
    // Cleanup rate limit entry
    rateLimits.delete(socket.id);
  });
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    protocol: req.protocol,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 HTTPS redirect: ${process.env.NODE_ENV === 'production' ? 'enabled' : 'disabled'}`);
});