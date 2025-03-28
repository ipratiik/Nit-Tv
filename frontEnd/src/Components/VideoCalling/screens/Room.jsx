import React, { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketProvider"; // Import the socket hook
import PeerService from "../service/peer"; // Import the PeerService class
import "./Room.css"; // Import styles

const Room = () => {
    const socket = useSocket(); // Get the socket instance
    const [localStream, setLocalStream] = useState(null); // Local video stream
    const [remoteStream, setRemoteStream] = useState(null); // Remote video stream
    const [roomId, setRoomId] = useState(null); // Current room ID
    const [isStarted, setIsStarted] = useState(false); // Whether the user has clicked "Start"
    const [waiting, setWaiting] = useState(false); // Waiting for another user
    const peerInstance = useRef(null); // Store the PeerService instance
    const localVideoRef = useRef(null); // Ref for local video element
    const remoteVideoRef = useRef(null); // Ref for remote video element

    useEffect(() => {
        const initLocalStream = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
                console.log("Local stream initialized:", stream);
                setLocalStream(stream);
            } catch (error) {
                console.error("Error accessing media devices:", error.name, error.message);
                if (error.name === "NotAllowedError") {
                    console.warn("Permissions denied for camera/microphone.");
                } else if (error.name === "NotFoundError") {
                    console.warn("No camera/microphone found.");
                }
            }
        };
        initLocalStream();

        return () => {
            if (localStream) {
                console.log("Cleaning up local stream");
                localStream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);


    useEffect(() => {
        if (localStream && localVideoRef.current) {
            console.log("Just added Assigning local stream to video element");
            localVideoRef.current.srcObject = localStream;
        } else {
            console.log("Just added Local stream or video ref is missing");
        }
    }, [localStream]);



    // Set the remote stream on the video element when the stream or ref changes
    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            console.log("Remote stream set on video element via useEffect");
        }
    }, [remoteStream, remoteVideoRef]);

    // Handle socket events
    useEffect(() => {
        if (!socket || !isStarted) return;

        // When matched with another user
        socket.on("join-room", async ({ roomId, from }) => {
            console.log(`Joined room ${roomId} with user ${from}`);
            setRoomId(roomId);
            setWaiting(false);
            peerInstance.current = new PeerService(); // Create a new PeerService instance

            // Add local stream to the peer connection
            localStream.getTracks().forEach((track) =>
                peerInstance.current.webRTCPeer.addTrack(track, localStream)
            );
            console.log("Local stream tracks added to peer connection");

            // Listen for remote stream
            peerInstance.current.webRTCPeer.ontrack = (event) => {
                console.log("ontrack event fired");
                console.log("Received remote stream:", event.streams[0]);
                setRemoteStream(event.streams[0]);
            };

            // Log connection state changes
            peerInstance.current.webRTCPeer.onconnectionstatechange = () => {
                console.log(
                    "Connection state:",
                    peerInstance.current.webRTCPeer.connectionState
                );
            };

            // Log ICE connection state changes
            peerInstance.current.webRTCPeer.oniceconnectionstatechange = () => {
                console.log(
                    "ICE connection state:",
                    peerInstance.current.webRTCPeer.iceConnectionState
                );
            };

            // Handle ICE candidates
            peerInstance.current.webRTCPeer.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log("Sending ICE candidate");
                    socket.emit("ice-candidate", {
                        candidate: event.candidate,
                        to: from,
                    });
                }
            };

            // Decide which peer creates the offer based on socket IDs
            if (socket.id < from) {
                // This peer creates the offer
                console.log("This peer is the offerer");
                const offer = await peerInstance.current.getOffer();
                socket.emit("offer", { offer, roomId, to: from });
            } else {
                console.log("This peer will wait for an offer");
            }
        });

        // Receive an offer
        socket.on("offer", async ({ offer, from, roomId }) => {
            console.log(`Received offer from ${from} in room ${roomId}`);
            setRoomId(roomId);
            setWaiting(false);

            // If we already have a peer instance, don't create a new one
            if (!peerInstance.current) {
                peerInstance.current = new PeerService();

                // Add local stream to the peer connection
                localStream.getTracks().forEach((track) =>
                    peerInstance.current.webRTCPeer.addTrack(track, localStream)
                );
                console.log("Local stream tracks added to peer connection");

                // Listen for remote stream
                peerInstance.current.webRTCPeer.ontrack = (event) => {
                    console.log("ontrack event fired");
                    console.log("Received remote stream:", event.streams[0]);
                    setRemoteStream(event.streams[0]);
                };

                // Log connection state changes
                peerInstance.current.webRTCPeer.onconnectionstatechange = () => {
                    console.log(
                        "Connection state:",
                        peerInstance.current.webRTCPeer.connectionState
                    );
                };

                // Log ICE connection state changes
                peerInstance.current.webRTCPeer.oniceconnectionstatechange = () => {
                    console.log(
                        "ICE connection state:",
                        peerInstance.current.webRTCPeer.iceConnectionState
                    );
                };

                // Handle ICE candidates
                peerInstance.current.webRTCPeer.onicecandidate = (event) => {
                    if (event.candidate) {
                        console.log("Sending ICE candidate");
                        socket.emit("ice-candidate", {
                            candidate: event.candidate,
                            to: from,
                        });
                    }
                };
            }

            // Set the remote offer and create an answer
            try {
                await peerInstance.current.setRemoteDescription(offer);
                const answer = await peerInstance.current.getAnswer(offer);
                socket.emit("answer", { answer, to: from });
            } catch (error) {
                console.error("Error handling offer:", error);
            }
        });

        // Receive an answer
        socket.on("answer", async ({ answer }) => {
            console.log("Received answer");
            if (peerInstance.current && peerInstance.current.webRTCPeer.signalingState === "have-local-offer") {
                try {
                    await peerInstance.current.setRemoteDescription(answer);
                } catch (error) {
                    console.error("Error setting remote answer:", error);
                }
            } else {
                console.error(
                    "Cannot set remote answer: RTCPeerConnection is not in the correct state",
                    peerInstance.current?.webRTCPeer.signalingState
                );
            }
        });

        // Receive an ICE candidate
        socket.on("ice-candidate", async ({ candidate }) => {
            console.log("Received ICE candidate");
            if (peerInstance.current) {
                try {
                    await peerInstance.current.webRTCPeer.addIceCandidate(
                        new RTCIceCandidate(candidate)
                    );
                } catch (error) {
                    console.error("Error adding ICE candidate:", error);
                }
            }
        });

        // When the other user leaves
        socket.on("user-left", () => {
            console.log("Other user left the room");
            setRemoteStream(null);
            setRoomId(null);
            if (peerInstance.current) {
                peerInstance.current.webRTCPeer.close();
                peerInstance.current = null;
            }
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;
            }
        });

        // Waiting for another user
        socket.on("waiting", (message) => {
            console.log(message);
            setWaiting(true);
        });

        // Cleanup socket listeners on unmount
        return () => {
            socket.off("join-room");
            socket.off("offer");
            socket.off("answer");
            socket.off("ice-candidate");
            socket.off("user-left");
            socket.off("waiting");
        };
    }, [socket, isStarted, localStream]);

    // Handle "Start" button click
    const handleStart = () => {
        setIsStarted(true);
        socket.emit("start");
    };

    // Handle "Next" button click
    const handleNext = () => {
        if (peerInstance.current) {
            peerInstance.current.webRTCPeer.close();
            peerInstance.current = null;
        }
        setRemoteStream(null);
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
        socket.emit("next", roomId);
        setRoomId(null);
    };

    // Handle "Stop" button click
    const handleStop = () => {
        if (peerInstance.current) {
            peerInstance.current.webRTCPeer.close();
            peerInstance.current = null;
        }
        setRemoteStream(null);
        setRoomId(null);
        setIsStarted(false);
        setWaiting(false);
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
        socket.emit("stop", roomId);
    };

    return (
        <div className="room-container">
            <div className="video-container">
                {/* Local Video Window */}
                <div className="video-box local-video">
                    {localStream ? (
                        <video ref={localVideoRef} autoPlay muted playsInline />
                    ) : (
                        <div className="video-placeholder">Loading your video...</div>
                    )}
                </div>

                {/* Remote Video Window */}
                <div className="video-box remote-video">
                    {remoteStream ? (
                        <video ref={remoteVideoRef} autoPlay playsInline />
                    ) : (
                        <div className="video-placeholder">
                            {waiting ? "Waiting for a stranger..." : "No one connected yet"}
                        </div>
                    )}
                </div>
            </div>
            <section className="button_chat">
                <div className="controls">
                    {!isStarted ? (
                        <button onClick={handleStart}>Start</button>
                    ) : (
                        <>
                            {waiting && !remoteStream ? (
                                <p>Waiting for another user...</p>
                            ) : (
                                <>
                                    <button onClick={handleNext}>Next</button>
                                    <button onClick={handleStop}>Stop</button>
                                </>
                            )}
                        </>
                    )}
                </div>

                <div className="chat-container">
                    <div className="chat-box">
                        <div className="messages">
                            {/* Messages will be displayed here */}
                        </div>
                    </div>
                    <div className="chat-input">
                        <input type="text" placeholder="Type a message..." />
                        <button>Send</button>
                    </div>
                </div>


            </section>
        </div>
    );
};

export default Room;