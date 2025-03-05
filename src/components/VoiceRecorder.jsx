import React, { useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("https://chat-app-backend-2ph1.onrender.com");

const VoiceRecorder = ({ user, receiver }) => {
  const [recording, setRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);
  const [recordTime, setRecordTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const intervalRef = useRef(null);

  // ✅ Start Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);
      setAudioChunks([]); // Reset chunks
  
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks((prev) => [...prev, event.data]);
        }
      };
  
      mediaRecorder.start();
      setRecordTime(0);
  
      // Track recording time
      intervalRef.current = setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("❌ Error accessing microphone:", error);
    }
  };
  
  

  // ✅ Stop Recording & Upload
  const stopRecording = async () => {
    setRecording(false);
    clearInterval(intervalRef.current);
  
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
  
      mediaRecorderRef.current.onstop = async () => {
        console.log("🎤 Recording stopped. Processing audio...");
  
        if (audioChunks.length === 0) {
          console.error("❌ No recorded audio found. Recording might have failed.");
          return;
        }
  
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const audioFile = new File([audioBlob], "voiceMessage.webm", { type: "audio/webm" });
  
        console.log("📤 Uploading recorded audio...");
        uploadAudio(audioFile);
      };
    }
  };
  

  // ✅ Upload Voice Message
  const uploadAudio = async (file) => {
    if (!file) {
      console.error("❌ No audio file to upload.");
      return;
    }
  
    const formData = new FormData();
    formData.append("file", file);
    formData.append("from", user);
    formData.append("to", receiver);
  
    console.log("📤 Uploading file:", file);
  
    try {
      const response = await axios.post(
        "https://chat-app-backend-2ph1.onrender.com/api/messages/addvoice",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
  
      if (response.status !== 200) {
        throw new Error(`❌ Unexpected response: ${response.status}`);
      }
  
      const { audioUrl } = response.data;
      socket.emit("send-voice-msg", { to: receiver, audioUrl });
      console.log("✅ Voice message sent:", audioUrl);
    } catch (error) {
      console.error("❌ Error uploading audio:", error.response ? error.response.data : error.message);
    }
  };
  
  

  return (
    <div className="flex flex-col items-center mt-5">
      <button
        onClick={recording ? stopRecording : startRecording}
        className={`p-5 rounded-full text-white shadow-lg transition duration-300 ${
          recording ? "bg-red-500 animate-pulse" : "bg-green-500 hover:bg-green-600"
        }`}
      >
        🎤
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
