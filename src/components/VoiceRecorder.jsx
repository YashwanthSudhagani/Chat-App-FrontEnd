import React, { useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { MicrophoneIcon } from "@heroicons/react/24/solid";

const socket = io("https://chat-app-backend-2ph1.onrender.com");
const chatURL = "https://chat-app-backend-2ph1.onrender.com/api";
const VoiceRecorder = ({ user, receiver }) => {
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const intervalRef = useRef(null);
  const audioChunksRef = useRef([]); // ✅ Store audio chunks

  // ✅ Start Recording
  const startRecording = async () => {
    try {
      console.log("🎤 Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = []; // Reset chunks

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log("🔹 Audio chunk captured:", event.data);
        }
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordTime(0);

      intervalRef.current = setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);

      console.log("🎤 Recording started...");
    } catch (error) {
      console.error("❌ Error accessing microphone:", error);
    }
  };

  // ✅ Stop Recording & Upload
  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;
    
    console.log("🛑 Stopping recording...");
    mediaRecorderRef.current.stop();
    clearInterval(intervalRef.current);
    setRecording(false);

    mediaRecorderRef.current.onstop = async () => {
      console.log("🎤 Recording stopped. Processing audio...");
      
      if (audioChunksRef.current.length === 0) {
        console.error("❌ No recorded audio found.");
        return;
      }

      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const audioFile = new File([audioBlob], "voiceMessage.webm", { type: "audio/webm" });

      console.log("📤 Uploading recorded audio...");
      uploadAudio(audioFile);
    };
  };

  const uploadAudio = async (file) => {
    if (!file) {
      console.error("❌ No audio file to upload.");
      return;
    }

    if (!user || !receiver) {
      console.error("❌ Sender (user) or receiver ID is missing.");
      return;
    }

    console.log("📤 Preparing to upload file:", file);

    const formData = new FormData();
    formData.append("from", user); // ✅ Ensure correct key
    formData.append("to", receiver); // ✅ Ensure correct key
    formData.append("file", file); // ✅ Must match backend (`file`, not `audio`)

    // ✅ Log FormData for debugging
    for (let pair of formData.entries()) {
      console.log("📝 FormData:", pair[0], pair[1]);
    }

    try {
      const response = await axios.post(
        `${chatURL}/messages/addvoice`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.status !== 201) {
        throw new Error(`❌ Unexpected response: ${response.status}`);
      }

      const { audioUrl } = response.data;
      socket.emit("send-voice-msg", { to: receiver, audioUrl });

      console.log("✅ Voice message uploaded successfully:", audioUrl);
    } catch (error) {
      console.error("❌ Error uploading audio:", error.response?.data || error.message);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <button
        onClick={recording ? stopRecording : startRecording}
        className={`"h-6 w-6 text-gray-400 hover:text-gray-600 cursor-pointer" ${
          recording ? "bg-red-500 animate-pulse" : "bg-grey-500 hover:bg-grey-600"
        }`}
      >
        <MicrophoneIcon />
      </button>

      {recording && (
        <p className="mt-2 text-lg text-gray-700 font-semibold">
          Recording... <span className="text-red-500">{recordTime}s</span>
        </p>
      )}
    </div>
  );
};

export default VoiceRecorder;
