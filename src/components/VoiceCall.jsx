import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { initializePeer } from "../utils/peerClient";
import {
  PhoneXMarkIcon,
  MicrophoneIcon,
  PauseIcon,
  PlayIcon,
  UserPlusIcon,
} from "@heroicons/react/24/solid";

const socket = io("http://localhost:5000", {
  transports: ["websocket", "polling"], // Ensure correct transport
  withCredentials: false,
});

const VoiceCall = ({ selectedChannel, onClose }) => {
  const peerConnections = useRef({});
  const localStream = useRef(null);
  const remoteStreams = useRef({});
  const [users, setUsers] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);
  const [muted, setMuted] = useState(false);
  const [onHold, setOnHold] = useState(false);
  const [peerId, setPeerId] = useState(null);
  const peerInstance = useRef(null);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId || !selectedChannel?._id) return;
    joinCall();
    return () => {
      socket.emit("leave-voice-call", { roomId: selectedChannel._id, userId });
      Object.values(peerConnections.current).forEach((peer) => peer.close());
      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [userId, selectedChannel]);

  useEffect(() => {
    socket.on("incoming-call", ({ callerId, peerId }) => {
      console.log(`📞 Incoming call from ${callerId}`);
      setIncomingCall({ callerId, peerId });
    });
    return () => socket.off("incoming-call");
  }, []);

  useEffect(() => {
    // ✅ Initialize PeerJS with userId
    peerInstance.current = initializePeer(userId);

    peerInstance.current.on("open", (id) => {
      console.log("📡 Connected to PeerJS with ID:", id);
      setPeerId(id);

      // ✅ Emit join-voice-call event
      socket.emit("join-voice-call", {
        roomId: selectedChannel._id,
        userId,
        peerId: id,
      });
    });

    peerInstance.current.on("call", (call) => {
      console.log("📞 Incoming call... Answering...");

      // ✅ Ensure user has granted media permissions
      navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then((stream) => {
          localStream.current = stream;
          call.answer(stream);

          call.on("stream", (remoteStream) => {
            remoteStreams.current[call.peer] = remoteStream;
            setUsers((prevUsers) => [...prevUsers, call.peer]);
          });
        })
        .catch((err) => console.error("🎤 Media access error:", err));
    });

    return () => {
      if (peerInstance.current) {
        peerInstance.current.destroy();
      }
    };
  }, [userId, selectedChannel._id]);

  const joinCall = async () => {
    try {
      console.log("🎤 Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.current = stream;
      console.log("🎤 Microphone access granted.");
    } catch (error) {
      console.error("❌ Error accessing microphone:", error);
    }
  };

  const startCall = () => {
    socket.emit("start-call", { callerId: userId, receiverId: selectedChannel._id, peerId });
  };

  const handleMute = () => {
    if (!localStream.current) return;
    const audioTrack = localStream.current.getAudioTracks()[0];
    audioTrack.enabled = !muted;
    setMuted(!muted);
    socket.emit("toggle-mute", { userId, isMuted: !muted });
  };

  const handleHold = () => {
    if (!localStream.current) return;
    const audioTrack = localStream.current.getAudioTracks()[0];
    audioTrack.enabled = !onHold;
    setOnHold(!onHold);
    socket.emit("hold-call", { userId, isOnHold: !onHold });
  };

  const addUserToCall = (newUserId) => {
    socket.emit("add-user-to-call", { roomId: selectedChannel._id, newUserId });
  };

  const handleEndCall = () => {
    socket.emit("leave-voice-call", { roomId: selectedChannel._id, userId });
    Object.values(peerConnections.current).forEach((peer) => peer.close());
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      {incomingCall ? (
        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <h3 className="text-lg font-semibold">Call from {incomingCall.callerId}</h3>
          <div className="mt-4 flex gap-4 justify-center">
            <button
              className="bg-green-500 px-4 py-2 rounded-lg"
              onClick={() => {
                console.log("✅ Accepting call...");
                socket.emit("accept-call", { callerId: incomingCall.callerId, receiverId: userId, peerId });
                setIncomingCall(null);
              }}
            >
              Accept
            </button>
            <button
              className="bg-red-500 px-4 py-2 rounded-lg"
              onClick={() => {
                console.log("❌ Declining call...");
                socket.emit("decline-call", { callerId: incomingCall.callerId, receiverId: userId });
                setIncomingCall(null);
              }}
            >
              Decline
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col justify-center items-center">
          <div className="absolute bottom-10 flex gap-6 bg-gray-800 p-4 rounded-full">
            <button onClick={handleEndCall} className="p-2 bg-red-500 rounded-full">
              <PhoneXMarkIcon className="w-6 h-6 text-white" />
            </button>
            <button onClick={() => addUserToCall("NEW_USER_ID")} className="p-2 bg-blue-500 rounded-full">
              <UserPlusIcon className="w-6 h-6 text-white" />
            </button>
            <button onClick={handleMute} className="p-2 bg-gray-700 rounded-full">
              <MicrophoneIcon className="w-6 h-6 text-white" />
            </button>
            <button onClick={handleHold} className="p-2 bg-yellow-500 rounded-full">
              {onHold ? <PlayIcon className="w-6 h-6 text-white" /> : <PauseIcon className="w-6 h-6 text-white" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceCall;
