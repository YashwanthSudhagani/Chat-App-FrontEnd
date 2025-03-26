import React, { useState, useEffect } from "react";
import { Copy } from "lucide-react";
import io from "socket.io-client"; // Import socket.io-client

const socket = io("http://localhost:5000"); // Connect to backend

const InviteButton = ({ chatId }) => {
  const [inviteLink, setInviteLink] = useState("");
  const [invites, setInvites] = useState([]);

  // WebSocket listener for real-time invites
  useEffect(() => {
    const handleNewInvite = (data) => {
      if (data.chatId === chatId) {
        setInvites((prev) => [...prev, data]); // Append new invites
      }
    };

    socket.on("new-invite", handleNewInvite); // Listen for 'new-invite' event
    return () => socket.off("new-invite", handleNewInvite); // Cleanup listener
  }, [chatId]);

  // Generate Invite Link when clicking "Invite"
  const generateInviteLink = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/invites/generate-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId }),
      });
  
      const data = await response.json();
      setInviteLink(`http://localhost:3000?inviteId=${data.inviteId}`);
 // This looks incorrect
      // Now directs to login
    } catch (error) {
      alert("Failed to generate invite. Please try again.");
    }
  };
  

  // Copy Invite Link to Clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      alert("✅ Invite link copied!");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="p-2 border rounded-lg">
      {/* Invite Button (NOW GENERATES THE LINK) */}
      <button
        onClick={generateInviteLink} // Clicking this button generates the invite link
        className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 w-full shadow-md mt-2 sticky bottom-0"
      >
        Invite
      </button>

      {/* Show Generated Invite Link */}
      {inviteLink && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={inviteLink}
            readOnly
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={copyToClipboard}
            className="p-2 bg-gray-200 rounded"
          >
            <Copy size={18} />
          </button>
        </div>
      )}

      {/* Real-Time Invite List */}
      <div className="mt-4">
        <ul className="mt-2 space-y-2">
          {invites.map((invite, index) => (
            <li key={index} className="text-blue-600 break-all">
              <a href={invite.inviteLink} className="hover:underline">
                {invite.inviteLink}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default InviteButton;