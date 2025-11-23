const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const compression = require('compression');

const app = express();
const server = http.createServer(app);

// Socket.IO for chat and room management
const io = socketIo(server, { 
  cors: { 
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e8,
  allowEIO3: true,
  perMessageDeflate: {
    threshold: 1024
  }
});

// Trust proxy for Railway
app.set('trust proxy', 1);

app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Security headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'SAMEORIGIN');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// HTTPS redirect for Railway
app.use((req, res, next) => {
  const host = req.header('host');
  const proto = req.header('x-forwarded-proto');
  
  if (process.env.RAILWAY_ENVIRONMENT && proto !== 'https') {
    return res.redirect(301, `https://${host}${req.url}`);
  }
  next();
});

// Data storage
const messages = {};
const users = {};
const rooms = {};

// Rate limiting
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 10000;
const MAX_MESSAGES_PER_WINDOW = 50;

// Room cleanup
const ROOM_CLEANUP_INTERVAL = 60000;
const ROOM_INACTIVITY_TIMEOUT = 1800000;

// Participant colors
const participantColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B195', '#C06C84',
  '#6C5B7B', '#F67280', '#355C7D', '#99B898', '#FECEAB'
];

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
    return false;
  }
  
  limit.messageCount++;
  return true;
}

function cleanupInactiveRooms() {
  const now = new Date();
  for (const roomCode in rooms) {
    const room = rooms[roomCode];
    if (now - room.lastActivity > ROOM_INACTIVITY_TIMEOUT) {
      console.log(`🧹 Cleaning up inactive room: ${roomCode}`);
      delete rooms[roomCode];
      delete messages[roomCode];
    }
  }
}

setInterval(cleanupInactiveRooms, ROOM_CLEANUP_INTERVAL);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);
  
  socket.on('createRoom', (roomCode) => {
    if (rooms[roomCode]) {
      socket.emit('room-exists', { roomCode });
      return;
    }
    
    const username = socket.username || 'Anonymous';
    const userColor = participantColors[Math.floor(Math.random() * participantColors.length)];
    
    rooms[roomCode] = {
      creator: socket.id,
      participants: {
        [socket.id]: { username, color: userColor, joinedAt: new Date() }
      },
      createdAt: new Date(),
      lastActivity: new Date()
    };
    
    messages[roomCode] = [];
    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.username = username;
    
    socket.emit('room-created', { 
      roomCode, 
      participants: rooms[roomCode].participants,
      color: userColor
    });
    
    console.log(`🏠 Room created: ${roomCode} by ${username}`);
  });
  
  socket.on('joinRoom', ({ roomCode, username }) => {
    if (!rooms[roomCode]) {
      socket.emit('room-not-found', { roomCode });
      return;
    }
    
    const room = rooms[roomCode];
    const userColor = participantColors[Math.floor(Math.random() * participantColors.length)];
    
    room.participants[socket.id] = { 
      username, 
      color: userColor, 
      joinedAt: new Date() 
    };
    room.lastActivity = new Date();
    
    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.username = username;
    
    socket.emit('room-joined', { 
      roomCode, 
      participants: room.participants, 
      messages: messages[roomCode] || [],
      color: userColor
    });
    
    socket.to(roomCode).emit('participant-joined', { 
      socketId: socket.id,
      username,
      color: userColor,
      roomCode,
      participants: room.participants
    });
    
    console.log(`👤 ${username} joined room: ${roomCode}`);
  });
  
  socket.on('send-message', ({ roomCode, message, username }) => {
    if (!checkRateLimit(socket.id)) {
      socket.emit('rate-limited', { message: 'Too many messages. Please slow down.' });
      return;
    }
    
    if (!messages[roomCode]) messages[roomCode] = [];
    
    const messageData = {
      id: Date.now(),
      username,
      message,
      timestamp: new Date(),
      socketId: socket.id,
      color: rooms[roomCode]?.participants[socket.id]?.color || '#0066CC'
    };
    
    messages[roomCode].push(messageData);
    
    if (messages[roomCode].length > 1000) {
      messages[roomCode] = messages[roomCode].slice(-1000);
    }
    
    io.to(roomCode).emit('new-message', messageData);
    
    if (rooms[roomCode]) {
      rooms[roomCode].lastActivity = new Date();
    }
  });
  
  socket.on('typing', ({ roomCode, username, isTyping }) => {
    socket.to(roomCode).emit('user-typing', { username, isTyping });
  });
  
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
  
  socket.on('accept-call', ({ roomCode }) => {
    if (rooms[roomCode]) rooms[roomCode].lastActivity = new Date();
    socket.to(roomCode).emit('call-accepted', { roomCode });
  });
  
  socket.on('reject-call', ({ roomCode }) => {
    socket.to(roomCode).emit('call-rejected', { roomCode });
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
    
    rateLimits.delete(socket.id);
    console.log('❌ User disconnected:', socket.id);
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    protocol: req.protocol,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    environment: process.env.RAILWAY_ENVIRONMENT || 'development',
    activeRooms: Object.keys(rooms).length,
    activeConnections: io.engine.clientsCount
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.RAILWAY_ENVIRONMENT || 'development'}`);
  console.log(`🔒 HTTPS redirect: ${process.env.RAILWAY_ENVIRONMENT ? 'enabled' : 'disabled'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
