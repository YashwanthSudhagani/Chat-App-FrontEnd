import Peer from "peerjs";

export const initializePeer = (userId) => {
  return new Peer(userId, {
    host: "localhost", // Change this in production
    port: 5000, // ✅ Use the correct PeerJS port
    path: "/peerjs",
    secure: false, // ❌ Don't use HTTPS in localhost
    debug: 3, // Enables debugging logs
  });
};
