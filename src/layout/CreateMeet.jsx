

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../components/firebase";

function CreateMeet({ user }) {
  const [roomId, setRoomId] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [activeTab, setActiveTab] = useState("create"); // "create" or "join"
  const navigate = useNavigate();

  const handleRoomIdGenerate = () => {
    const randomId = Math.random().toString(36).substring(2, 9);
    const timestamp = Date.now().toString().slice(-4);
    setRoomId(randomId + timestamp);
  };

  const createRoomInDatabase = async (type) => {
    if (!user) {
      console.warn("User not logged in, room will not be saved to database");
      return;
    }

    try {
      await axios.post(`${API_URL}/rooms`, {
        roomId: roomId,
        hostId: user.uid,
        type: type,
      });
      console.log(`Room created in database: ${roomId}`);
    } catch (error) {
      console.error("Error creating room in database:", error);
    }
  };

  const handleOneAndOneCall = async () => {
    if (!roomId) {
      alert("Please Generate Room Id First");
      return;
    }

    await createRoomInDatabase("one-on-one");
    navigate(`/room/${roomId}?type=one-on-one`);
  };

  const handleGroupCall = async () => {
    if (!roomId) {
      alert("Please Generate Room Id First");
      return;
    }

    await createRoomInDatabase("group-call");
    navigate(`/room/${roomId}?type=group-call`);
  };

  const handleJoinRoom = async (type) => {
    if (!joinRoomId.trim()) {
      alert("Please enter a valid Room ID");
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/rooms/${joinRoomId}`);
      const roomType = response.data.type || type;
      navigate(`/room/${joinRoomId}?type=${roomType}`);
    } catch (error) {
      console.log("Room not found in database, joining anyway");
      navigate(`/room/${joinRoomId}?type=${type}`);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-60px)] p-5 bg-gray-100">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-xl text-center">
        <h1 className="text-3xl font-semibold text-gray-800 mb-4">Welcome to Video Calling App</h1>

        <div className="flex border-b border-gray-300 mb-5">
          <button
            className={`flex-1 py-3 text-lg font-medium transition-all ${
              activeTab === "create" ? "text-blue-600 border-b-4 border-blue-600" : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("create")}
          >
            Create Room
          </button>
          <button
            className={`flex-1 py-3 text-lg font-medium transition-all ${
              activeTab === "join" ? "text-blue-600 border-b-4 border-blue-600" : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("join")}
          >
            Join Room
          </button>
        </div>

        {activeTab === "create" ? (
          <div>
            <p className="text-lg text-gray-600 mb-6">Start a video call with a randomly generated Room ID</p>
            <div className="flex mb-6">
              <input
                type="text"
                className="flex-1 p-3 border border-gray-300 rounded-l-md text-lg"
                placeholder="Generated Room ID"
                value={roomId}
                readOnly
              />
              <button
                className="bg-blue-500 text-white p-3 rounded-r-md text-lg transition duration-300 hover:bg-blue-600"
                onClick={handleRoomIdGenerate}
              >
                Generate
              </button>
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                className="bg-green-500 text-white py-3 px-6 rounded-lg text-lg transition duration-300 hover:bg-green-600 disabled:bg-gray-400"
                onClick={handleOneAndOneCall}
                disabled={!roomId}
              >
                One-on-One Call
              </button>
              <button
                className="bg-green-500 text-white py-3 px-6 rounded-lg text-lg transition duration-300 hover:bg-green-600 disabled:bg-gray-400"
                onClick={handleGroupCall}
                disabled={!roomId}
              >
                Group Call
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-lg text-gray-600 mb-6">Enter an existing Room ID to join a call</p>
            <div className="mb-6">
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-md text-lg"
                placeholder="Enter Room ID"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
              />
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                className="bg-green-500 text-white py-3 px-6 rounded-lg text-lg transition duration-300 hover:bg-green-600 disabled:bg-gray-400"
                onClick={() => handleJoinRoom("one-on-one")}
                disabled={!joinRoomId}
              >
                Join One-on-One Call
              </button>
              <button
                className="bg-green-500 text-white py-3 px-6 rounded-lg text-lg transition duration-300 hover:bg-green-600 disabled:bg-gray-400"
                onClick={() => handleJoinRoom("group-call")}
                disabled={!joinRoomId}
              >
                Join Group Call
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateMeet;
