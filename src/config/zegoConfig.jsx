// import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";

// export const initializeZego = () => {
//   try {
//     const userId = localStorage.getItem("userId"); 
//     const userName = localStorage.getItem("username");

//     if (!userId || !userName) {
//       throw new Error("❌ User ID or username not found in local storage.");
//     }

//     const roomId = `room-${Math.random().toString(36).substr(2, 9)}`;
//     console.log("🔹 Generated Room ID:", roomId);
//     console.log("🔹 Retrieved userId:", userId);
//     console.log("🔹 Retrieved userName:", userName);

//     const token = ZegoUIKitPrebuilt.generateKitTokenForTest(
//       944416030, 
//       "d2000bf5b12f962ba1d16e41651ac06f", 
//       roomId,
//       userId,
//       userName // Now passing userName
//     );

//     console.log("🔹 Generated Zego Token:", token);

//     const zegoInstance = ZegoUIKitPrebuilt.create(token);
//     zegoInstance.joinRoom();

//     return { zegoInstance, roomId };
//   } catch (error) {
//     console.error("🚨 Error initializing Zego:", error.message || error);
//     return null; // Prevent app from crashing
//   }
// };
