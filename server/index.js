const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // allow all origins for development
    methods: ["GET", "POST"]
  }
});

// In-memory store for groups and users
// groups = { "otp123": { roomId: "room_abc123", users: [{id, name}] } }
const groups = {};

// Helper to generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('createGroup', ({ userName }, callback) => {
    let otp;
    do {
      otp = generateOTP();
    } while (groups[otp]); // Ensure uniqueness

    const roomId = crypto.randomUUID();
    
    // Create new group
    groups[otp] = {
      roomId,
      users: []
    };

    // Add user to the room and group internal array
    socket.join(roomId);
    
    const newUser = { id: socket.id, name: userName, lat: null, lng: null };
    groups[otp].users.push(newUser);

    // Save context in socket for easy cleanup
    socket.data.otp = otp;
    socket.data.roomId = roomId;
    socket.data.userName = userName;

    console.log(`Group created with OTP ${otp} by user ${userName}`);
    
    // Send back the initialized group details
    callback({ success: true, otp, roomId, users: groups[otp].users });
    
    // Notify the room
    io.to(roomId).emit('userJoined', { users: groups[otp].users });
  });

  socket.on('joinGroup', ({ userName, otp }, callback) => {
    const group = groups[otp];
    if (!group) {
        return callback({ success: false, message: 'Invalid OTP' });
    }

    const { roomId } = group;
    socket.join(roomId);

    const newUser = { id: socket.id, name: userName, lat: null, lng: null };
    group.users.push(newUser);

    // Save context in socket
    socket.data.otp = otp;
    socket.data.roomId = roomId;
    socket.data.userName = userName;

    console.log(`User ${userName} joined group ${otp}`);

    // Send success
    callback({ success: true, roomId, users: group.users });

    // Notify room
    io.to(roomId).emit('userJoined', { users: group.users });
  });

  socket.on('updateLocation', ({ lat, lng }) => {
    const { roomId, otp } = socket.data;
    if (roomId && otp && groups[otp]) {
        // Find user and update their location internally
        const user = groups[otp].users.find((u) => u.id === socket.id);
        if (user) {
            user.lat = lat;
            user.lng = lng;
        }

        // Broadcast to everyone in the room EXCEPT the sender
        socket.to(roomId).emit('locationUpdated', { id: socket.id, lat, lng });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const { otp, roomId } = socket.data;

    if (otp && roomId && groups[otp]) {
        // Remove user from the group array
        groups[otp].users = groups[otp].users.filter(u => u.id !== socket.id);
        
        // Notify others
        io.to(roomId).emit('userLeft', { id: socket.id, users: groups[otp].users });

        // If room is empty, cleanup group to save memory
        if (groups[otp].users.length === 0) {
            delete groups[otp];
            console.log(`Group ${otp} deleted as it became empty.`);
        }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
