import React, { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketProvider"; 
import PeerService from "../service/peer"; 
import "./Room.css"; 
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const Room = () => {
    // todo :: intall better comments to see the comments with colous
    const socket = useSocket();
    const [localStream, setLocalStream] = useState(null); // Local video stream
    const [remoteStream, setRemoteStream] = useState(null); // Remote video stream
    const [roomId, setRoomId] = useState(null); 
    const [isStarted, setIsStarted] = useState(false);
    const [waiting, setWaiting] = useState(false); 
    const peerInstance = useRef(null); 
    const localVideoRef = useRef(null);  
    const remoteVideoRef = useRef(null);  
    const [message, setMessage] = useState("");
    const [messageArray, setMessageArray] = useState([]);
    const [mySocketID, setMySocketId] = useState("");
    // const [otherUserID, setOtherUserID] = useState("");

    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const auth = getAuth();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (loggedInUser) => {
            if (!loggedInUser) {
                navigate("/"); 
            } else {
                setUser(loggedInUser);
            }
        });

        return () => unsubscribe(); 
    }, [auth, navigate]);

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
            localVideoRef.current.srcObject = localStream;
        } 
        else {
            console.log("Just added Local stream or video ref is missing");
        }
    }, [localStream]);



    // todo :: Set the remote stream on the video element when the stream or ref changes
    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            console.log("Remote stream set on video element via useEffect");
        }
    }, [remoteStream, remoteVideoRef]);

    useEffect(() => {
        if (!socket || !isStarted) return;

        socket.on("join-room", async ({ roomId, from, me }) => {
            console.log(`Joined room ${roomId} with user ${from}`);
            setRoomId(roomId);
            setWaiting(false);
            setMySocketId(from)
            peerInstance.current = new PeerService(); 

            localStream.getTracks().forEach((track) =>
                peerInstance.current.webRTCPeer.addTrack(track, localStream)
            );
            console.log("Local stream tracks added to peer connection");

            // todo :: listen for remote stream
            peerInstance.current.webRTCPeer.ontrack = (event) => {
                console.log("ontrack event fired");
                console.log("Received remote stream:", event.streams[0]);
                setRemoteStream(event.streams[0]);
            };

            // * log connection state changes
            peerInstance.current.webRTCPeer.onconnectionstatechange = () => {
                console.log(
                    "Connection state:",
                    peerInstance.current.webRTCPeer.connectionState
                );
            };

            // * log ICE connection state changes
            peerInstance.current.webRTCPeer.oniceconnectionstatechange = () => {
                console.log(
                    "ICE connection state:",
                    peerInstance.current.webRTCPeer.iceConnectionState
                );
            };

            //todo :: Handle ICE candidates
            peerInstance.current.webRTCPeer.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log("Sending ICE candidate");
                    socket.emit("ice-candidate", {
                        candidate: event.candidate,
                        to: from,
                    });
                }
            };

            // todo :: decide which peer creates the offer based on socket IDs
            if (socket.id < from) {
                // This peer creates the offer
                console.log("This peer is the offerer");
                const offer = await peerInstance.current.getOffer();
                socket.emit("offer", { offer, roomId, to: from });
            } else {
                console.log("This peer will wait for an offer");
            }
        });

        // todo :: receive an offer
        socket.on("offer", async ({ offer, from, roomId }) => {
            console.log(`Received offer from ${from} in room ${roomId}`);
            setRoomId(roomId);
            setWaiting(false);

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

            // todo :: set the remote offer and create an answer
            try {
                await peerInstance.current.setRemoteDescription(offer);
                const answer = await peerInstance.current.getAnswer(offer);
                socket.emit("answer", { answer, to: from });
            } catch (error) {
                console.error("Error handling offer:", error);
            }
        });

        // todo :: receive an answer
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

        // todo :: eeceive an ICE candidate
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

        socket.on("waiting", (message) => {
            console.log(message);
            setWaiting(true);
        });

        socket.on("chat-message", ({ roomId, message, mySocketId }) => {
            console.log(message, " and ", roomId);
            setMessageArray((e) => [...e, { message, mySocketId }]);
        });

        return () => {
            socket.off("join-room");
            socket.off("offer");
            socket.off("answer");
            socket.off("ice-candidate");
            socket.off("user-left");
            socket.off("waiting");
            socket.off("chat-message");
        };
    }, [socket, isStarted, localStream]);


    const handleStart = () => {
        setIsStarted(true);
        socket.emit("start");
    };

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

    const sendMessage = () => {
        setMessage("")
        if (!roomId) {
            toast.error("No one to chat at the moment");
            return;
        }
        socket.emit("chat-message", { roomId, message, mySocketID });
    };

    const handleKeyPress = (event) => {
        if (event.key === "Enter") {
            sendMessage();
        }
    };

    return (
        <div className="room-container">
            <ToastContainer />
            <div className="video-container">
                <div className="video-box local-video">
                    {localStream ? (
                        <video ref={localVideoRef} autoPlay muted playsInline />
                    ) : (
                        <div className="video-placeholder">Loading your video...</div>
                    )}
                </div>

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
                            {
                                messageArray.map(({ message, mySocketId }, index) => (
                                    mySocketID === mySocketId ?
                                        <div key={index} style={{ color: "black" }}>
                                            You : {message}
                                        </div>
                                        :
                                        <div key={index} style={{ color: "black" }}>
                                            Other : {message}
                                        </div>
                                ))
                            }
                        </div>
                    </div>
                    <div className="chat-input">
                        <input onChange={(e) => { setMessage(e.target.value) }} type="text" placeholder="Type a message..." onKeyDown={handleKeyPress} value={message} />
                        <button onClick={sendMessage} >Send</button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Room;