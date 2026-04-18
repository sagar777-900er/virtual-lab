import { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

export default function useMultiplayer() {
  const socketRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const [roomCode, setRoomCode] = useState(null)
  const [isHost, setIsHost] = useState(false)
  const [participants, setParticipants] = useState([])
  const [username, setUsername] = useState('')
  
  // Event callback refs (set by the consuming component)
  const onBodyAddedRef = useRef(null)
  const onBodyRemovedRef = useRef(null)
  const onCursorUpdateRef = useRef(null)
  const onPhysicsSyncRef = useRef(null)

  // Initialize socket connection
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return

    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      console.log('[Multiplayer] Connected:', socket.id)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
      setRoomCode(null)
      setParticipants([])
      console.log('[Multiplayer] Disconnected')
    })

    socket.on('room-joined', (data) => {
      setRoomCode(data.roomCode)
      setIsHost(data.isHost)
      setParticipants(data.participants)
      console.log('[Multiplayer] Joined room:', data.roomCode, 'Host:', data.isHost)
    })

    socket.on('user-joined', (data) => {
      setParticipants(data.participants)
      console.log('[Multiplayer] User joined:', data.username)
    })

    socket.on('user-left', (data) => {
      setParticipants(prev => prev.filter(p => p.id !== data.socketId))
      console.log('[Multiplayer] User left:', data.socketId)
    })

    socket.on('host-changed', (data) => {
      setIsHost(data.newHost === socket.id)
      console.log('[Multiplayer] Host changed to:', data.newHost)
    })

    socket.on('body-added', (data) => {
      if (onBodyAddedRef.current) {
        onBodyAddedRef.current(data.bodyData)
      }
    })

    socket.on('body-removed', (data) => {
      if (onBodyRemovedRef.current) {
        onBodyRemovedRef.current(data.bodyId)
      }
    })

    socket.on('cursor-update', (data) => {
      if (onCursorUpdateRef.current) {
        onCursorUpdateRef.current(data)
      }
    })

    socket.on('physics-sync', (data) => {
      if (onPhysicsSyncRef.current) {
        onPhysicsSyncRef.current(data)
      }
    })

    return socket
  }, [])

  // Generate a random room code
  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
  }

  // Create a new room
  const createRoom = useCallback((name = 'User') => {
    const socket = socketRef.current || connect()
    const code = generateCode()
    setUsername(name)
    
    // Wait for connection if needed
    const doJoin = () => {
      socket.emit('join-room', { roomCode: code, username: name })
    }

    if (socket.connected) {
      doJoin()
    } else {
      socket.once('connect', doJoin)
    }

    return code
  }, [connect])

  // Join existing room
  const joinRoom = useCallback((code, name = 'User') => {
    const socket = socketRef.current || connect()
    setUsername(name)

    const doJoin = () => {
      socket.emit('join-room', { roomCode: code.toUpperCase(), username: name })
    }

    if (socket.connected) {
      doJoin()
    } else {
      socket.once('connect', doJoin)
    }
  }, [connect])

  // Leave current room
  const leaveRoom = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    setIsConnected(false)
    setRoomCode(null)
    setIsHost(false)
    setParticipants([])
  }, [])

  // Broadcast body creation
  const sendBodyCreated = useCallback((bodyData) => {
    if (socketRef.current && roomCode) {
      socketRef.current.emit('body-created', { roomCode, bodyData })
    }
  }, [roomCode])

  // Broadcast body deletion
  const sendBodyDeleted = useCallback((bodyId) => {
    if (socketRef.current && roomCode) {
      socketRef.current.emit('body-deleted', { roomCode, bodyId })
    }
  }, [roomCode])

  // Broadcast cursor movement
  const sendCursorMove = useCallback((position) => {
    if (socketRef.current && roomCode) {
      socketRef.current.emit('cursor-move', { roomCode, position })
    }
  }, [roomCode])

  // Broadcast physics state (host only)
  const sendPhysicsUpdate = useCallback((delta) => {
    if (socketRef.current && roomCode && isHost) {
      socketRef.current.emit('physics-update', { roomCode, delta })
    }
  }, [roomCode, isHost])

  // Set event handlers from consuming component
  const setHandlers = useCallback(({ onBodyAdded, onBodyRemoved, onCursorUpdate, onPhysicsSync }) => {
    onBodyAddedRef.current = onBodyAdded || null
    onBodyRemovedRef.current = onBodyRemoved || null
    onCursorUpdateRef.current = onCursorUpdate || null
    onPhysicsSyncRef.current = onPhysicsSync || null
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  return {
    isConnected,
    roomCode,
    isHost,
    participants,
    username,
    createRoom,
    joinRoom,
    leaveRoom,
    sendBodyCreated,
    sendBodyDeleted,
    sendCursorMove,
    sendPhysicsUpdate,
    setHandlers,
  }
}
