import { createContext, useMemo, useContext, useEffect } from "react";
import React from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => {
    const socket = useContext(SocketContext);
    return socket;
};

export default function SocketProvider(props) {
    // Socket for video chat signaling
    const socket = useMemo(
        () =>
            // io("http://localhost:8000", {
            io("wss://manittv-production.up.railway.app/", {
                transports: ["websocket", "polling"], // Force WebSocket transport to avoid polling issues
                reconnection: true, // Enable reconnection
                reconnectionAttempts: 5, // Number of reconnection attempts
                reconnectionDelay: 1000, // Delay between reconnection attempts (1 second)
                secure: true, // Explicitly mark it as a secure WebSocket connection
                // todo :: this prevents the web Socket connection to fail 
            }),
        []
    );

    useEffect(() => {
        // Log connection status
        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
        });
        socket.on("connect_error", (error) => {
            console.error("Socket connection error:", error);
        });
        socket.on("disconnect", (reason) => {
            console.log("Socket disconnected:", reason);
        });
        socket.on("reconnect", (attempt) => {
            console.log("Socket reconnected after attempt:", attempt);
        });
        socket.on("reconnect_failed", () => {
            console.error("Socket reconnection failed");
        });

        // Handle any unexpected errors
        socket.on("error", (error) => {
            console.error("Socket error:", error);
        });

    }, [socket]);

    return (
        <SocketContext.Provider value={socket}>
            {props.children}
        </SocketContext.Provider>
    );
}