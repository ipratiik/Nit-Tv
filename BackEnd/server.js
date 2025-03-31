const express = require("express");
const { Server } = require("socket.io");

const app = express();

const server = app.listen(8000, () => {
    console.log(`Server running on port 8000`);
});

app.get("/", (req, response) => {
    response.send("api is working fine")
})

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "https://manitv.vercel.app", "https://manitv.live"],
        methods: ["GET", "POST"],
    },
});

// Store users who are available to chat (after clicking "Start")
let availableUsers = [];
// Store active rooms (key: roomId, value: array of user socket IDs)
const rooms = new Map();

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // When a user clicks "Start", add them to the available users pool
    socket.on("start", () => {
        availableUsers.push(socket.id);
        console.log(`User ${socket.id} is available to chat`);
        matchUsers(socket);
    });

    // When a user clicks "Next", find a new match
    socket.on("next", ({roomId : currentRoomId, otherUserID}) => {
        leaveRoom(socket, currentRoomId);
        matchUsers(socket);
        io.to(otherUserID).emit("clear-Messages");
        
    });

    // When a user clicks "Stop", remove them from their room and the available pool
    socket.on("stop", ({roomId, otherUserID}) => {
        leaveRoom(socket, roomId);
        availableUsers = availableUsers.filter((id) => id !== socket.id);
        io.to(otherUserID).emit("clear-Messages");
        console.log(`User ${socket.id} stopped the stream`);
    });

    // Handle WebRTC signaling
    socket.on("offer", (data) => {
        const { offer, roomId, to } = data;
        io.to(to).emit("offer", { offer, from: socket.id, roomId });
    });

    socket.on("answer", (data) => {
        const { answer, to } = data;
        io.to(to).emit("answer", { answer, from: socket.id });
    });

    socket.on("ice-candidate", (data) => {
        const { candidate, to } = data;
        io.to(to).emit("ice-candidate", { candidate, from: socket.id });
    });

    socket.on("chat-message", ({ roomId, message, mySocketID, otherUserID : otherUserId }) => {
        console.log(`Received message in server:`, message, "for room:", roomId,  "users :: " , mySocketID, " !!", otherUserId);
        io.to(otherUserId).emit("chat-message", { roomId, message, mySocketID });
    });


    // Handle user disconnection
    socket.on("disconnect", () => { 
        availableUsers = availableUsers.filter((id) => id !== socket.id);
        for (const [roomId, users] of rooms.entries()) {
            if (users.includes(socket.id)) {
                leaveRoom(socket, roomId);
                break;
            }
        }
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Function to match users
function matchUsers(socket) {
    // Remove the current user from the available pool
    availableUsers = availableUsers.filter((id) => id !== socket.id);

    // Find another available user to pair with
    if (availableUsers.length > 0) {
        const otherUserId = availableUsers.shift(); // Take the first available user
        const roomId = `${socket.id}-${otherUserId}`; // Create a unique room ID

        // Add both users to the room
        rooms.set(roomId, [socket.id, otherUserId]);
        socket.join(roomId);
        io.to(otherUserId).emit("join-room", { roomId, from: socket.id, me : otherUserId });
        socket.emit("join-room", { roomId, from: otherUserId, me : socket.id });

        console.log(`Matched ${socket.id} with ${otherUserId} in room ${roomId}`);
    } else {
        // No other users available, add this user back to the pool
        availableUsers.push(socket.id);
        socket.emit("waiting", "Waiting for another user...");
    }
}

// Function to handle leaving a room
function leaveRoom(socket, roomId) {
    if (roomId && rooms.has(roomId)) {
        const users = rooms.get(roomId);
        const otherUserId = users.find((id) => id !== socket.id);
        if (otherUserId) {
            io.to(otherUserId).emit("user-left", { roomId });
        }
        socket.leave(roomId);
        rooms.delete(roomId);
        console.log(`User ${socket.id} left room ${roomId}`);
    }
}