import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import Experiment from './models/Experiment.js'

dotenv.config()

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/virtual-lab')
  .then(() => console.log('📦 Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
})

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Room storage (in-memory for now, MongoDB later)
const rooms = new Map()

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`)

  // List active rooms
  socket.on('list-rooms', () => {
    const roomList = []
    for (const [code, room] of rooms.entries()) {
      roomList.push({
        code,
        hostId: room.host,
        participantCount: room.participants.size,
      })
    }
    socket.emit('rooms-list', roomList)
  })

  // Join room
  socket.on('join-room', ({ roomCode, username }) => {
    socket.join(roomCode)

    if (!rooms.has(roomCode)) {
      rooms.set(roomCode, {
        host: socket.id,
        participants: new Map(),
        worldState: null,
      })
    }

    const room = rooms.get(roomCode)
    room.participants.set(socket.id, { username, cursor: null })

    // Notify others
    socket.to(roomCode).emit('user-joined', {
      socketId: socket.id,
      username,
      participants: Array.from(room.participants.entries()).map(([id, p]) => ({
        id,
        ...p,
      })),
    })

    // Send current state to new user
    if (room.worldState) {
      socket.emit('world-state', room.worldState)
    }

    socket.emit('room-joined', {
      roomCode,
      isHost: room.host === socket.id,
      participants: Array.from(room.participants.entries()).map(([id, p]) => ({
        id,
        ...p,
      })),
    })

    console.log(`[Room] ${username} joined room ${roomCode}`)
  })

  // Cursor movement
  socket.on('cursor-move', ({ roomCode, position }) => {
    socket.to(roomCode).emit('cursor-update', {
      socketId: socket.id,
      position,
    })
  })

  // Physics state update (host → guests)
  socket.on('physics-update', ({ roomCode, delta }) => {
    const room = rooms.get(roomCode)
    if (room && room.host === socket.id) {
      room.worldState = delta
      socket.to(roomCode).emit('physics-sync', delta)
    }
  })

  // Body created
  socket.on('body-created', ({ roomCode, bodyData }) => {
    socket.to(roomCode).emit('body-added', { socketId: socket.id, bodyData })
  })

  // Body deleted
  socket.on('body-deleted', ({ roomCode, bodyId }) => {
    socket.to(roomCode).emit('body-removed', { socketId: socket.id, bodyId })
  })

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`)

    // Remove from rooms
    for (const [code, room] of rooms.entries()) {
      if (room.participants.has(socket.id)) {
        room.participants.delete(socket.id)
        io.to(code).emit('user-left', { socketId: socket.id })

        // If host left, assign new host
        if (room.host === socket.id && room.participants.size > 0) {
          room.host = room.participants.keys().next().value
          io.to(code).emit('host-changed', { newHost: room.host })
        }

        // Clean up empty rooms
        if (room.participants.size === 0) {
          rooms.delete(code)
        }
      }
    }
  })
})

// Routes
app.get('/api/experiments', async (req, res) => {
  try {
    const experiments = await Experiment.find().sort({ createdAt: -1 });
    res.json({ experiments, total: experiments.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/experiments', async (req, res) => {
  try {
    const { title, description, thumbnail, stateData, author } = req.body;
    const newExp = new Experiment({ title, description, thumbnail, stateData, author });
    const saved = await newExp.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.get('/api/rooms', (req, res) => {
  const roomList = []
  for (const [code, room] of rooms.entries()) {
    roomList.push({
      code,
      hostId: room.host,
      participantCount: room.participants.size,
    })
  }
  res.json({ rooms: roomList, total: roomList.length })
})

// Start server
const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`\n🔬 VIRTUAL-LAB Server running on http://localhost:${PORT}`)
  console.log(`📡 Socket.io ready for connections`)
  console.log(`💾 Using in-memory storage (MongoDB will be added later)\n`)
})
