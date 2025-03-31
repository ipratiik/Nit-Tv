import React, { useState, useEffect, useRef, Fragment } from 'react';
import { useSocket } from '../context/SocketProvider'; // Import the socket hook
import PeerService from '../service/peer'; // Import the PeerService class
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  CircleArrowRight,
  CirclePlay,
  CircleStop,
  Loader,
  SendHorizonal,
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

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
  const [message, setMessage] = useState('');
  const [messageArray, setMessageArray] = useState([]);
  const [mySocketID, setMySocketId] = useState('');
  const [otherUserID, setOtherUserID] = useState('');

  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (loggedInUser) => {
      if (!loggedInUser) {
        navigate('/'); // Redirect to home if not logged in
      } else {
        setUser(loggedInUser);
      }
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, [auth, navigate]);

  useEffect(() => {
    const initLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        console.log('Local stream initialized:', stream);
        setLocalStream(stream);
      } catch (error) {
        console.error(
          'Error accessing media devices:',
          error.name,
          error.message,
        );
        if (error.name === 'NotAllowedError') {
          console.warn('Permissions denied for camera/microphone.');
        } else if (error.name === 'NotFoundError') {
          console.warn('No camera/microphone found.');
        }
      }
    };
    initLocalStream();

    return () => {
      if (localStream) {
        console.log('Cleaning up local stream');
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      console.log('Just added Assigning local stream to video element');
      localVideoRef.current.srcObject = localStream;
    } else {
      console.log('Just added Local stream or video ref is missing');
    }
  }, [localStream]);

  // Set the remote stream on the video element when the stream or ref changes
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      console.log('Remote stream set on video element via useEffect');
    }
  }, [remoteStream, remoteVideoRef]);

  // Handle socket events
  useEffect(() => {
    if (!socket || !isStarted) return;

    // When matched with another user
    socket.on('join-room', async ({ roomId, from, me }) => {
      console.log(`Joined room ${roomId} with user ${from}`);
      setRoomId(roomId);
      setWaiting(false);
      setMySocketId(from);
      peerInstance.current = new PeerService(); // Create a new PeerService instance

      // Add local stream to the peer connection
      localStream
        .getTracks()
        .forEach((track) =>
          peerInstance.current.webRTCPeer.addTrack(track, localStream),
        );
      console.log('Local stream tracks added to peer connection');

      // Listen for remote stream
      peerInstance.current.webRTCPeer.ontrack = (event) => {
        console.log('ontrack event fired');
        console.log('Received remote stream:', event.streams[0]);
        setRemoteStream(event.streams[0]);
      };

      // Log connection state changes
      peerInstance.current.webRTCPeer.onconnectionstatechange = () => {
        console.log(
          'Connection state:',
          peerInstance.current.webRTCPeer.connectionState,
        );
      };

      // Log ICE connection state changes
      peerInstance.current.webRTCPeer.oniceconnectionstatechange = () => {
        console.log(
          'ICE connection state:',
          peerInstance.current.webRTCPeer.iceConnectionState,
        );
      };

      // Handle ICE candidates
      peerInstance.current.webRTCPeer.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('Sending ICE candidate');
          socket.emit('ice-candidate', {
            candidate: event.candidate,
            to: from,
          });
        }
      };

      // Decide which peer creates the offer based on socket IDs
      if (socket.id < from) {
        // This peer creates the offer
        console.log('This peer is the offerer');
        const offer = await peerInstance.current.getOffer();
        socket.emit('offer', { offer, roomId, to: from });
      } else {
        console.log('This peer will wait for an offer');
      }
    });

    // Receive an offer
    socket.on('offer', async ({ offer, from, roomId }) => {
      console.log(`Received offer from ${from} in room ${roomId}`);
      setRoomId(roomId);
      setWaiting(false);

      // If we already have a peer instance, don't create a new one
      if (!peerInstance.current) {
        peerInstance.current = new PeerService();

        // Add local stream to the peer connection
        localStream
          .getTracks()
          .forEach((track) =>
            peerInstance.current.webRTCPeer.addTrack(track, localStream),
          );
        console.log('Local stream tracks added to peer connection');

        // Listen for remote stream
        peerInstance.current.webRTCPeer.ontrack = (event) => {
          console.log('ontrack event fired');
          console.log('Received remote stream:', event.streams[0]);
          setRemoteStream(event.streams[0]);
        };

        // Log connection state changes
        peerInstance.current.webRTCPeer.onconnectionstatechange = () => {
          console.log(
            'Connection state:',
            peerInstance.current.webRTCPeer.connectionState,
          );
        };

        // Log ICE connection state changes
        peerInstance.current.webRTCPeer.oniceconnectionstatechange = () => {
          console.log(
            'ICE connection state:',
            peerInstance.current.webRTCPeer.iceConnectionState,
          );
        };

        // Handle ICE candidates
        peerInstance.current.webRTCPeer.onicecandidate = (event) => {
          if (event.candidate) {
            console.log('Sending ICE candidate');
            socket.emit('ice-candidate', {
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
        socket.emit('answer', { answer, to: from });
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    // Receive an answer
    socket.on('answer', async ({ answer }) => {
      console.log('Received answer');
      if (
        peerInstance.current &&
        peerInstance.current.webRTCPeer.signalingState === 'have-local-offer'
      ) {
        try {
          await peerInstance.current.setRemoteDescription(answer);
        } catch (error) {
          console.error('Error setting remote answer:', error);
        }
      } else {
        console.error(
          'Cannot set remote answer: RTCPeerConnection is not in the correct state',
          peerInstance.current?.webRTCPeer.signalingState,
        );
      }
    });

    // Receive an ICE candidate
    socket.on('ice-candidate', async ({ candidate }) => {
      console.log('Received ICE candidate');
      if (peerInstance.current) {
        try {
          await peerInstance.current.webRTCPeer.addIceCandidate(
            new RTCIceCandidate(candidate),
          );
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });

    // When the other user leaves
    socket.on('user-left', () => {
      console.log('Other user left the room');
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
    socket.on('waiting', (message) => {
      console.log(message);
      setWaiting(true);
    });

    socket.on('chat-message', ({ roomId, message, mySocketId }) => {
      console.log(message, ' and ', roomId);
      setMessageArray((e) => [...e, { message, mySocketId }]);
    });

    // Cleanup socket listeners on unmount
    return () => {
      socket.off('join-room');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('user-left');
      socket.off('waiting');
      socket.off('chat-message');
    };
  }, [socket, isStarted, localStream]);

  useEffect(() => {
    console.log('array of messgae :: ', messageArray);
  }, [messageArray]);

  // Handle "Start" button click
  const handleStart = () => {
    setIsStarted(true);
    socket.emit('start');
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
    socket.emit('next', roomId);
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
    socket.emit('stop', roomId);
  };

  const sendMessage = () => {
    setMessage('');
    if (!roomId) {
      toast.error('Chat starts when another user joins.');
      return;
    }
    console.log('Sending message: ', message, 'to room:', roomId);
    socket.emit('chat-message', { roomId, message, mySocketID });
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      sendMessage();
      event.target.value = '';
    }
  };

  return (
    <section
      className="-z-20 h-dvh"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' width='20' height='20' fill='none' stroke-width='2' stroke='%23E0E0E0'%3e%3cpath d='M0 .5H19.5V20'/%3e%3c/svg%3e")`,
      }}
    >
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{ duration: 3000 }}
      />
      <div className="container grid gap-8 lg:grid-cols-2">
        {/* Local Video Window */}
        <div className="relative flex items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-100 object-contain md:min-h-96">
          {localStream ? (
            <Fragment>
              <video ref={localVideoRef} autoPlay muted playsInline />
              <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center justify-center gap-4 md:hidden">
                {!isStarted ? (
                  <button
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-gradient-to-b from-emerald-500 via-emerald-600 to-emerald-700 px-2 py-1 font-medium text-white shadow-xl hover:shadow-2xl md:px-6 md:py-1.5 md:text-xl"
                    onClick={handleStart}
                  >
                    <CirclePlay strokeWidth={2.5} />
                    <p>Start</p>
                  </button>
                ) : waiting && !remoteStream ? (
                  <button
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-amber-200 bg-gradient-to-b from-orange-500 via-yellow-600 to-amber-700 px-2 py-1 font-medium text-white shadow-xl hover:shadow-2xl md:px-6 md:py-1.5 md:text-xl"
                    onClick={handleStop}
                  >
                    <CircleStop strokeWidth={2.5} />
                    <p>Stop</p>
                  </button>
                ) : (
                  <div className="grid w-full gap-5 lg:grid-cols-2">
                    <button
                      className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-200 bg-gradient-to-b from-cyan-400 via-sky-500 to-blue-600 px-2 py-1 font-medium text-white shadow-xl hover:shadow-2xl md:px-6 md:py-1.5 md:text-xl"
                      onClick={handleNext}
                    >
                      <p>Next</p>
                      <CircleArrowRight strokeWidth={2.5} />
                    </button>
                    <button
                      className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-amber-200 bg-gradient-to-b from-yellow-400 via-yellow-500 to-amber-600 px-2 py-1 font-medium text-white shadow-xl hover:shadow-2xl md:px-6 md:py-1.5 md:text-xl"
                      onClick={handleStop}
                    >
                      <CircleStop strokeWidth={2.5} />
                      <p>Stop</p>
                    </button>
                  </div>
                )}
              </div>
            </Fragment>
          ) : (
            <div className="flex flex-col items-center gap-4 p-5">
              <Loader className="animate-spin [animation-duration:2s] md:size-20" />
              <p className="text-center text-xl md:text-3xl">
                Loading your video...
              </p>
            </div>
          )}
        </div>

        {/* Remote Video Window */}
        <div className="flex items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-100 object-contain">
          {remoteStream ? (
            <video ref={remoteVideoRef} autoPlay playsInline />
          ) : (
            <div className="flex items-center justify-center">
              {waiting ? (
                <div className="flex flex-col items-center justify-center gap-4 p-5">
                  <Loader className="animate-spin [animation-duration:2s] md:size-20" />
                  <p className="text-center text-xl md:text-3xl">
                    Waiting for other NITian...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 p-5">
                  <Loader className="animate-spin [animation-duration:2s] md:size-20" />
                  <p className="text-center text-xl md:text-3xl">
                    Click on Start button to Search...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="container grid gap-4 p-4 lg:grid-cols-2">
        <div className="flex flex-col justify-between">
          <div className="hidden justify-center gap-4 md:flex">
            {!isStarted ? (
              <button
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-gradient-to-b from-emerald-500 via-emerald-600 to-emerald-700 px-2 py-1 font-medium text-white shadow-xl hover:shadow-2xl md:px-6 md:py-1.5 md:text-xl"
                onClick={handleStart}
              >
                <CirclePlay strokeWidth={2.5} />
                <p>Start</p>
              </button>
            ) : waiting && !remoteStream ? (
              <button
                className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-gradient-to-b from-orange-500 via-yellow-600 to-amber-700 px-2 py-1 font-medium text-white shadow-xl hover:shadow-2xl md:px-6 md:py-1.5 md:text-xl"
                onClick={handleStop}
              >
                <CircleStop strokeWidth={2.5} />
                <p>Stop</p>
              </button>
            ) : (
              <div className="grid w-full gap-5 lg:grid-cols-2">
                <button
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-200 bg-gradient-to-b from-cyan-400 via-sky-500 to-blue-600 px-2 py-1 font-medium text-white shadow-xl hover:shadow-2xl md:px-6 md:py-1.5 md:text-xl"
                  onClick={handleNext}
                >
                  <p>Next </p>
                  <CircleArrowRight strokeWidth={2.5} />
                </button>
                <button
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-amber-200 bg-gradient-to-b from-yellow-400 via-yellow-500 to-amber-600 px-2 py-1 font-medium text-white shadow-xl hover:shadow-2xl md:px-6 md:py-1.5 md:text-xl"
                  onClick={handleStop}
                >
                  <CircleStop strokeWidth={2.5} />
                  <p>Stop</p>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <input
              onChange={(e) => setMessage(e.target.value)}
              type="text"
              placeholder="Type a message..."
              onKeyDown={handleKeyPress}
              value={message}
              className="w-full rounded-full bg-gray-100 py-1 pl-4 ring-2 ring-emerald-500 focus:outline-emerald-600 md:py-2"
            />
            <button
              className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-blue-200 bg-emerald-600 p-1.5 font-medium text-white shadow-xl hover:shadow-2xl md:p-2.5 md:text-xl"
              onClick={sendMessage}
            >
              <SendHorizonal strokeWidth={2.5} className="size-5 md:size-6" />
            </button>
          </div>
        </div>

        <div className="h-44 max-h-44 overflow-y-auto rounded-lg border-2 border-dashed border-gray-300 bg-white p-4 shadow-xl">
          <div className="flex flex-col gap-1">
            {messageArray.map(({ message, mySocketId }, index) =>
              mySocketID === mySocketId ? (
                <div key={index} className="text-right text-black">
                  <b>You:</b> <p>{message}</p>
                </div>
              ) : (
                <div key={index} className="text-left text-black">
                  <b>Other:</b> <p>{message}</p>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Room;
