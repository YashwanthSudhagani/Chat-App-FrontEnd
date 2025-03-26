"use client";

import { useRef, useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { APP_ID, SECRET } from "../Config";

function Room({ user }) {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const videoContainerRef = useRef(null);
  const [joined, setJoined] = useState(false);
  const [callType, setCallType] = useState("");
  const [zegoInstance, setZegoInstance] = useState(null);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const type = query.get("type");
    if (type) {
      setCallType(type);
    }
  }, [location.search]);

  useEffect(() => {
    let isMounted = true;

    const initializeZegoCloud = async () => {
      if (!callType || !roomId || !videoContainerRef.current) return;

      try {
        if (zegoInstance) {
          await new Promise((resolve) => {
            zegoInstance.destroy();
            setTimeout(resolve, 1000);
          });
          setZegoInstance(null);
        }

        const appID = APP_ID;
        const serverSecret = SECRET;
        const userName = user?.displayName || "Guest User";

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID,
          serverSecret,
          roomId,
          Date.now().toString(),
          userName
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);

        if (isMounted) {
          setZegoInstance(zp);

          zp.joinRoom({
            container: videoContainerRef.current,
            sharedLinks: [
              {
                name: "Video Call Link",
                url: `${window.location.protocol}//${window.location.host}/room/${roomId}?type=${encodeURIComponent(
                  callType
                )}`,
              },
            ],
            scenario: {
              mode:
                callType === "one-on-one"
                  ? ZegoUIKitPrebuilt.OneONoneCall
                  : ZegoUIKitPrebuilt.GroupCall,
            },
            maxUsers: callType === "one-on-one" ? 2 : 10,
            onJoinRoom: () => {
              if (isMounted) setJoined(true);
            },
            onLeaveRoom: () => {
              if (isMounted) navigate("/chat");
            },
          });
        }
      } catch (error) {
        console.error("Error initializing ZegoCloud:", error);
      }
    };

    initializeZegoCloud();

    return () => {
      isMounted = false;
      if (zegoInstance) {
        setTimeout(() => {
          try {
            zegoInstance.destroy();
            setZegoInstance(null);
          } catch (error) {
            console.error("Error during cleanup:", error);
          }
        }, 500);
      }
    };
  }, [callType, roomId, navigate, user]);

  const handleExit = () => {
    if (zegoInstance) {
      try {
        zegoInstance.destroy();
        setZegoInstance(null);
      } catch (error) {
        console.error("Error destroying instance:", error);
      }
    }
    navigate("/chat");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] relative">
      {!joined && (
        <>
          <header className="bg-gray-800 text-white py-4 px-5 text-lg font-medium text-center">
            {callType === "one-on-one" ? "One-on-One Video Call" : "Group Video Call"}
          </header>
          <button
            className="absolute top-4 right-5 bg-red-500 text-white py-2 px-4 rounded cursor-pointer text-sm z-10 transition duration-300 hover:bg-red-600"
            onClick={handleExit}
          >
            Exit
          </button>
        </>
      )}
      <div ref={videoContainerRef} className="flex-1 bg-gray-900" />
    </div>
  );
}

export default Room;
