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
        allowedHeaders: ["Access-Control-Allow-Origin"],
        credentials: true
    },
});


let availableUsers = [];
// todo :: store active rooms, key: roomId, value: array of user socket IDs
const rooms = new Map();

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // When a user clicks "start" button in the frontEnd this is activated
    socket.on("start", () => {
        availableUsers.push(socket.id);
        matchUsers(socket);
    });

    // when a user clicks "Next" button
    socket.on("next", (currentRoomId) => {
        leaveRoom(socket, currentRoomId);
        matchUsers(socket);
    });

    // when a user clicks "Stop", remove them from their room and the available pool as well
    socket.on("stop", (roomId) => {
        leaveRoom(socket, roomId);
        availableUsers = availableUsers.filter((id) => id !== socket.id);
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

    socket.on("chat-message", ({ roomId, message, mySocketID }) => {
        console.log(`Received message in server:`, message, "for room:", roomId);
        io.emit("chat-message", { roomId, message, mySocketId: mySocketID });
    });

    socket.on("disconnect", () => {
        availableUsers = availableUsers.filter((id) => id !== socket.id);
        for (const [roomId, users] of rooms.entries()) {
            if (users.includes(socket.id)) {
                leaveRoom(socket, roomId);
                break;
            }
        }
    });
});

function matchUsers(socket) {
    availableUsers = availableUsers.filter((id) => id !== socket.id);
    if (availableUsers.length > 0) {
        const otherUserId = availableUsers.shift(); // todo :: take the first available user
        const roomId = `${socket.id}-${otherUserId}`;

        // todo :: adding both users to the room
        rooms.set(roomId, [socket.id, otherUserId]);
        socket.join(roomId);
        io.to(otherUserId).emit("join-room", { roomId, from: socket.id });
        socket.emit("join-room", { roomId, from: otherUserId });
        console.log(`Matched ${socket.id} with ${otherUserId} in room ${roomId}`);

    }
    else {
        availableUsers.push(socket.id);
        socket.emit("waiting", "Waiting for another user...");
    }
}

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