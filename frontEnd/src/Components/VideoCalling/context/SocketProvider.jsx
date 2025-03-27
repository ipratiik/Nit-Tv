import { createContext, useMemo, useContext, useEffect } from "react";
import React from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => {
    const socket = useContext(SocketContext);
    return socket;
};

export default function SocketProvider(props) {
    const socket = io("https://manittv.up.railway.app:8000")
    // const socket = io("http://localhost:8000")

    return (
        <SocketContext.Provider value={socket}>
            {props.children}
        </SocketContext.Provider>
    );
}