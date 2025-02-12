import React, { useState, useEffect } from "react";
import { useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  BellIcon,
  CalendarDaysIcon,
  PhotoIcon,
  MicrophoneIcon,
  FaceSmileIcon,
  PlusIcon,
  PaperAirplaneIcon,
  VideoCameraIcon,
  PhoneIcon,
  UserPlusIcon,
  EllipsisVerticalIcon,
  InboxArrowDownIcon,
  SunIcon,
  MoonIcon,
  ArrowUpOnSquareIcon,
  CogIcon,
  PencilIcon,
  TrashIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/solid";
import Picker from "emoji-picker-react"; // Using emoji-picker-react

const chatURL = "https://chat-app-backend-2ph1.onrender.com/api";
// Socket connection
const socket = io("https://chat-app-backend-2ph1.onrender.com", {
  withCredentials: true,
});

const generateAvatar = (username) => {
  if (!username) return { initial: "?", backgroundColor: "#cccccc" }; // Fallback for invalid username
  const avatarKey = `userAvatarImage_${username}`;
  const existingAvatar = localStorage.getItem(avatarKey);

  if (existingAvatar) {
    return JSON.parse(existingAvatar);
  }

  const colors = [
    "#FFD700",
    "#FFA07A",
    "#87CEEB",
    "#98FB98",
    "#DDA0DD",
    "#FFB6C1",
    "#FFC0CB",
    "#20B2AA",
    "#FF6347",
    "#708090",
    "#9370DB",
    "#90EE90",
    "#B0E0E6",
  ];
  const backgroundColor = colors[Math.floor(Math.random() * colors.length)];
  const initial = username.charAt(0).toUpperCase();

  const avatarImage = { initial, backgroundColor };
  localStorage.setItem(avatarKey, JSON.stringify(avatarImage));
  return avatarImage;
};

const ChatApp = () => {
  const [user, setUser] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // State to show emoji picker
  const [emoji, setEmoji] = useState(""); // State to store the selected emoji
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [dropdownMessage, setDropdownMessage] = useState(null);
  const [editMessageId, setEditMessageId] = useState(null);

  const userEmail = localStorage.getItem("userEmail");

  const handleEmojiPickerHideShow = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  useEffect(() => {
    if (userEmail) {
      socket.emit("add-user", userEmail);
    }

    // Listen for notifications
    socket.on("new-notification", (notification) => {
      alert(notification.message); // You can handle notifications however you like
    });

    return () => {
      socket.off("new-notification");
    };
  }, [userEmail]);

  // Fetch notifications from the backend
  useEffect(() => {
    if (userEmail) {
      fetch(`${chatURL}/notification/notifications/${userEmail}`)
        .then((res) => res.json())
        .then((data) => setNotifications(data.notifications))
        .catch((err) => console.error("Error fetching notifications:", err));
    }
  }, [userEmail]);

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    
    if (!isNotificationsOpen) {
      markNotificationsAsRead();
    }
  };
  
const markNotificationsAsRead = async () => {
  try {
    await axios.put(`${chatURL}/notification/notifications/read/${userEmail}`);
    
    // Update the local state to mark all notifications as read
    setNotifications((prevNotifications) =>
      prevNotifications.map((notif) => ({ ...notif, read: true }))
    );

    setUnreadNotifications(0); // Reset unread count
  } catch (err) {
    console.error("Error marking notifications as read:", err);
  }
};

  // Fetch available channels dynamically
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const userId = localStorage.getItem("userId"); // If you're going to use this userId
        const response = await fetch(
          `${chatURL}/auths/getAllUsers/${userId}` // Fixed template literal
        );

        if (!response.ok) {
          console.error("Error fetching channels:", response.statusText);
          return;
        }

        const data = await response.json(); // Parse JSON response
        setChannels(data); // Update channel list
      } catch (error) {
        console.error("Error fetching channels:", error.message);
      }
    };

    fetchChannels();
  }, []);

  // Fetch messages dynamically when a channel is selected
  useEffect(() => {
    if (!selectedChannel) return;

    // Function to fetch messages
    const fetchMessages = async () => {
      try {
        const response = await fetch(`${chatURL}/messages/getmsg`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from: localStorage.getItem("userId"),
            to: selectedChannel._id,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }

        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    // Fetch messages immediately when the channel is selected
    fetchMessages();

    // Set interval to fetch messages every second
    const intervalId = setInterval(fetchMessages, 1000);

    // Cleanup interval when the component unmounts or when the selectedChannel changes
    return () => clearInterval(intervalId);
  }, [selectedChannel]);

  // Listen for new messages via Socket.io
  useEffect(() => {
    socket.on("msg-receive", ({ msg, from }) => {
      console.log("Received new message from:", from, "Message:", msg);

      // Ensure the message gets added to the correct chat
      setMessages((prevMessages) => [
        ...prevMessages,
        { fromSelf: false, message: msg },
      ]);
    });

    return () => socket.off("msg-receive"); // Clean up listener
  }, []);

  useEffect(() => {
    // Scroll to the bottom when messages update
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Filter channels based on search input
  const filteredChannels = channels.filter((channel) =>
    channel.username.toLowerCase().includes(search.toLowerCase())
  );

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Send a new message
  const sendMessage = async () => {
    // Ensure that we have either text or an emoji to send
    if (!newMessage.trim() && !emoji) return;

    // Combine the emoji (if any) with the new message text
    const finalMessage = newMessage.trim() + emoji;

    // Emit the message immediately via socket.io for real-time update
    socket.emit("send-msg", {
      to: selectedChannel._id,
      msg: finalMessage,
      from: localStorage.getItem("userId"),
    });

    // Update the local messages state for the current user
    setMessages((prev) => [...prev, { fromSelf: true, message: finalMessage }]);

    // Clear the message input fields
    setNewMessage("");
    setEmoji(""); // Reset the emoji state after sending the message

    // Now store the message asynchronously in the database
    try {
      const messageData = {
        from: localStorage.getItem("userId"),
        to: selectedChannel._id,
        message: finalMessage,
      };

      await fetch(`${chatURL}/messages/addmsg`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
      });

      console.log("Message stored in DB");
    } catch (error) {
      console.error("Error storing message:", error);
    }
  };

  // Handle emoji selection
  const handleEmojiclick = (emojiObject) => {
    console.log("Selected emoji object:", emojiObject);
    if (emojiObject && emojiObject.emoji) {
      setNewMessage((prevMessage) => prevMessage + emojiObject.emoji);
      setShowEmojiPicker(false); // Hide the emoji picker after selecting an emoji
    } else {
      console.error("Invalid emoji object:", emojiObject);
    }
  };

  const toggleCalendar = () => setIsCalendarOpen(!isCalendarOpen);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setIsCalendarOpen(false); // Close the calendar modal after selecting a date
    console.log("Selected Date:", date); // For debugging
  }; // Call this when the user comes online or changes channel

  const handleEditMessage = async (messageId, text) => {
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        setEditMessageId(null);
      }
    } catch (err) {
      console.error("Error updating message:", err);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        console.log("Message deleted successfully");
      }
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  return (
    <div className={`flex h-screen ${darkMode ? "dark" : ""}`}>
      {/* Sidebar */}
      <aside className="w-20 bg-gradient-to-br from-blue-300 to-gray-500 dark:from-gray-800 dark:to-gray-900 flex flex-col py-6 space-y-6 items-center">
        {/* Logged-in User Avatar */}
        <div
          className="h-16 w-16 rounded-full border-2 border-white shadow-lg mb-8 flex items-center justify-center text-white font-bold text-xl"
          style={{
            backgroundColor: generateAvatar(user.username).backgroundColor,
          }}
        >
          {generateAvatar(user.username).initial}
        </div>
        <div className="space-y-6">
          <ChatBubbleLeftRightIcon className="h-8 w-8 text-white hover:text-gray-300 cursor-pointer" />
          <UserGroupIcon className="h-8 w-8 text-white hover:text-gray-300 cursor-pointer" />
          <BellIcon
            className="h-8 w-8 text-white hover:text-gray-300 cursor-pointer"
            onClick={toggleNotifications}
          />
          <CalendarDaysIcon
            className="h-8 w-8 text-white hover:text-gray-300 cursor-pointer"
            onClick={toggleCalendar}
          />
          <InboxArrowDownIcon className="h-8 w-8 text-white hover:text-gray-300 cursor-pointer" />
          <ArrowUpOnSquareIcon className="h-8 w-8 text-white hover:text-gray-300 cursor-pointer" />
        </div>
        <div className="flex-1"></div>
        <button
          className="h-8 w-8 text-white hover:text-gray-300 cursor-pointer"
          onClick={toggleDarkMode}
        >
          {darkMode ? <SunIcon /> : <MoonIcon />}
        </button>
        <button className="h-8 w-8 text-white hover:text-gray-300 cursor-pointer">
          <CogIcon />
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Channel List */}
        <section className="w-1/4 bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-700 p-4">
          <div className="border-b border-gray-400 dark:border-gray-600 pb-4">
            <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200">
              Chats
            </h2>
            <input
              type="text"
              placeholder="Search channels..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-2 w-full px-3 py-2 bg-gray-200 dark:bg-gray-600 rounded focus:outline-none"
            />
          </div>
          <ul className="mt-4 space-y-2">
            {filteredChannels.map((channel) => (
              <li
                key={channel._id}
                onClick={() => setSelectedChannel(channel)}
                className={`cursor-pointer p-2 rounded flex items-center shadow-sm ${
                  selectedChannel?._id === channel._id
                    ? "bg-blue-400 dark:bg-gray-600"
                    : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-500"
                }`}
              >
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold"
                  style={{
                    backgroundColor: generateAvatar(channel.username)
                      .backgroundColor,
                  }}
                >
                  {generateAvatar(channel.username).initial}
                </div>
                <span>{channel.username}</span>
              </li>
            ))}
          </ul>
          <button className="w-full mt-auto justify-center bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
            Invite
          </button>
        </section>

        {isNotificationsOpen && (
         <div className="absolute inset-y-0 right-0 w-[calc(100%-80px)] bg-white dark:bg-gray-900 flex flex-col p-6 z-50">
            <div className="flex justify-between items-center border-b pb-4 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Notifications
              </h3>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={toggleNotifications}
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {notifications.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                  No notifications yet!
                </p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif._id}
                    className={`py-2 px-4 rounded-md ${ 
                      notif.read ? "bg-gray-100" : "bg-yellow-100"
                    }`}
                  >
                    <p className="text-gray-800 dark:text-gray-200">
                      {notif.message}
                    </p>
                    <small className="text-gray-500">
                      {new Date(notif.timestamp).toLocaleString()}
                    </small>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Chat Section */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-white to-gray-200 dark:from-gray-900 dark:to-gray-800">
          <header className="px-6 py-4 flex items-center justify-between border-b border-gray-400 dark:border-gray-600">
            {selectedChannel ? (
              <div className="flex items-center space-x-4">
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold"
                  style={{
                    backgroundColor: generateAvatar(selectedChannel.username)
                      .backgroundColor,
                  }}
                >
                  {generateAvatar(selectedChannel.username).initial}
                </div>
                <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {selectedChannel.username}
                </h1>
              </div>
            ) : (
              <h1 className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                Select a Channel
              </h1>
            )}
            {selectedChannel && (
              <div className="flex items-center space-x-3">
                <button className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100">
                  <PhoneIcon className="h-6 w-6 text-blue-500 cursor-pointer" />
                </button>
                <button className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100">
                  <VideoCameraIcon className="h-6 w-6 text-blue-500 cursor-pointer" />
                </button>
                <button className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100">
                  <UserPlusIcon className="h-6 w-6 text-blue-500 cursor-pointer" />
                </button>
                <button className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100">
                  <EllipsisVerticalIcon className="h-6 w-6 text-blue-500 cursor-pointer" />
                </button>
              </div>
            )}
          </header>
          {isCalendarOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-1/3 p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Select a Date
                </h3>
                <Calendar
                  onChange={handleDateChange}
                  value={selectedDate}
                  className="react-calendar"
                />
                <button
                  className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  onClick={toggleCalendar}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
         <div className="flex-1 p-6 overflow-y-auto">
  {selectedChannel ? (
    messages.map((msg) => {
      const isHovered = hoveredMessage === msg._id;
      const isDropdownOpen = dropdownMessage === msg._id;

      return (
        <div
          key={msg._id}
          className={`flex ${msg.fromSelf ? "justify-end" : "justify-start"} mb-4 relative`}
          onMouseEnter={() => setHoveredMessage(msg._id)} // Show arrow on hover
          onMouseLeave={() => setHoveredMessage(null)} // Hide on leave
        >
          {/* Message Bubble */}
          <div className={`p-3 rounded-lg shadow-md max-w-xs relative ${msg.fromSelf ? "bg-blue-400 text-white" : "bg-white dark:bg-gray-700"}`}>
            <p>{msg.message}</p>

            {/* Show Up Arrow on Hover (Only for the Hovered Message) */}
            {isHovered && msg.fromSelf && (
              <button
                className="ml-2 p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 absolute bottom-1 right-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownMessage(isDropdownOpen ? null : msg._id); // Toggle dropdown for this message only
                }}
              >
                <ChevronUpIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
            )}
          </div>

          {/* Dropdown Popup (Only for the Clicked Message) */}
          {isDropdownOpen && (
            <div className="absolute -top-12 right-0 bg-gray-200 dark:bg-gray-600 p-2 rounded-md shadow-md z-50">
              <button
                className="flex items-center space-x-1 p-1 hover:bg-gray-300 dark:hover:bg-gray-500 rounded w-full"
                onClick={() => {
                  setDropdownMessage(null);
                  handleEditMessage(msg._id);
                }}
              >
                <PencilIcon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                <span className="text-sm">Edit</span>
              </button>
              <button
                className="flex items-center space-x-1 p-1 hover:bg-gray-300 dark:hover:bg-gray-500 rounded w-full"
                onClick={() => {
                  setDropdownMessage(null);
                  handleDeleteMessage(msg._id);
                }}
              >
                <TrashIcon className="h-4 w-4 text-red-500" />
                <span className="text-sm">Delete</span>
              </button>
            </div>
          )}
        </div>
      );
    })
  ) : (
    <p className="text-gray-500 dark:text-gray-400">No messages available.</p>
  )}
  <div ref={messagesEndRef} />
</div>



          {/* Input Section */}
          {selectedChannel && (
            <footer className="relative p-4 bg-gray-100 dark:bg-gray-700 border-t border-gray-400 dark:border-gray-600">
              <div className="flex items-center space-x-3">
                <PhotoIcon className="h-6 w-6 text-gray-400 hover:text-gray-600 cursor-pointer" />
                <MicrophoneIcon className="h-6 w-6 text-gray-400 hover:text-gray-600 cursor-pointer" />
                <FaceSmileIcon
                  className="h-6 w-6 text-gray-400 hover:text-gray-600 cursor-pointer"
                  onClick={handleEmojiPickerHideShow}
                />
                <PlusIcon className="h-6 w-6 text-gray-400 hover:text-gray-600 cursor-pointer" />
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-200 dark:bg-gray-600 px-4 py-2 rounded-full focus:outline-none"
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-600 px-4 py-2 text-white rounded-full hover:bg-blue-500"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
              {showEmojiPicker && (
                <div className="absolute bottom-14 left-10 z-10">
                  <Picker onEmojiClick={handleEmojiclick} />
                </div>
              )}
            </footer>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatApp;
