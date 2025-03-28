import { useState, useEffect } from "react"
import { useRef } from "react"
import { useNavigate } from "react-router-dom"
import io from "socket.io-client"
import axios from "axios"
import Calendar from "react-calendar"
import "react-calendar/dist/Calendar.css"
import VoiceCall from "../components/VoiceCall"
import { ReactMediaRecorder } from "react-media-recorder"
import Polls from "../components/Poll"
import InviteButton from "../components/InviteButton"
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
  UsersIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/solid"
import Picker from "emoji-picker-react" // Using emoji-picker-react

const chatURL = "https://chat-app-backend-2ph1.onrender.com/api"
// Socket connection
const socket = io("https://chat-app-backend-2ph1.onrender.com", {
  withCredentials: true,
})

const generateAvatar = (username) => {
  if (!username) return { initial: "?", backgroundColor: "#cccccc" } // Fallback for invalid username
  const avatarKey = `userAvatarImage_${username}`
  const existingAvatar = localStorage.getItem(avatarKey)

  if (existingAvatar) {
    return JSON.parse(existingAvatar)
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
  ]
  const backgroundColor = colors[Math.floor(Math.random() * colors.length)]
  const initial = username.charAt(0).toUpperCase()

  const avatarImage = { initial, backgroundColor }
  localStorage.setItem(avatarKey, JSON.stringify(avatarImage))
  return avatarImage
}

const ChatApp = (receiver) => {
  const navigate = useNavigate()
  const [user, setUser] = useState([])
  const [channels, setChannels] = useState([])
  const [selectedChannel, setSelectedChannel] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [search, setSearch] = useState("")
  const [darkMode, setDarkMode] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false) // State to show emoji picker
  const [emoji, setEmoji] = useState("") // State to store the selected emoji
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesContainerRef = useRef(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [hoveredMessage, setHoveredMessage] = useState(null)
  const [dropdownMessage, setDropdownMessage] = useState(null)
  const [editMessageId, setEditMessageId] = useState(null)
  const [editText, setEditText] = useState("")
  const [voiceMessages, setVoiceMessages] = useState([])
  const [userId, setUserId] = useState(null)
  const [recording, setRecording] = useState(false)
  const [recordTime, setRecordTime] = useState("0:00")
  const timerRef = useRef(null)
  const [isRecording, setIsRecording] = useState(false)
  const intervalRef = useRef(null)
  const [mediaBlobUrl, setMediaBlobUrl] = useState(null)
  const [isCallActive, setIsCallActive] = useState(false)
  const [showPolls, setShowPolls] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const [isGroupCreationMode, setIsGroupCreationMode] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [groupName, setGroupName] = useState("")
  // Add a new state for managing the "add members to group" UI
  const [isAddMembersMode, setIsAddMembersMode] = useState(false)
  const [groupToAddMembers, setGroupToAddMembers] = useState(null)
  const [membersToAdd, setMembersToAdd] = useState([])

  const userEmail = localStorage.getItem("userEmail")

  //  // Generate Invite Link and Copy to Clipboard
  // const handleInvite = async () => {
  //   if (!selectedChannel?._id) {
  //     alert("Please select a chat first.");
  //     return;
  //   }

  //   try {
  //     const response = await fetch("http://localhost:5000/api/invites/generate-invite", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ chatId: selectedChannel._id }),
  //     });

  //     if (!response.ok) throw new Error("Failed to generate invite");

  //     const data = await response.json();
  //     const inviteUrl = `http://localhost:3000/invite/${data.inviteId}`;

  //     // Copy invite link to clipboard
  //     await navigator.clipboard.writeText(inviteUrl);
  //     alert("✅ Invite link copied to clipboard!");
  //   } catch (error) {
  //     alert("❌ Error generating invite: " + error.message);
  //   }
  // };

  const handleEmojiPickerHideShow = () => {
    setShowEmojiPicker(!showEmojiPicker)
  }

  useEffect(() => {
    const fetchUserId = async () => {
      const id = localStorage.getItem("userId")
      setUserId(id)
    }
    fetchUserId()
  }, [])

  useEffect(() => {
    if (userEmail) {
      socket.emit("add-user", userEmail)
    }

    // Listen for notifications
    socket.on("new-notification", (notification) => {
      alert(notification.message) // You can handle notifications however you like
    })

    return () => {
      socket.off("new-notification")
    }
  }, [userEmail])

  // Fetch notifications from the backend
  useEffect(() => {
    if (userEmail) {
      fetch(`${chatURL}/notification/notifications/${userEmail}`)
        .then((res) => res.json())
        .then((data) => setNotifications(data.notifications))
        .catch((err) => console.error("Error fetching notifications:", err))
    }
  }, [userEmail])

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen)

    if (!isNotificationsOpen) {
      markNotificationsAsRead()
    }
  }

  const markNotificationsAsRead = async () => {
    try {
      await axios.put(`${chatURL}/notification/notifications/read/${userEmail}`)

      // Update the local state to mark all notifications as read
      setNotifications((prevNotifications) => prevNotifications.map((notif) => ({ ...notif, read: true })))

      setUnreadNotifications(0) // Reset unread count
    } catch (err) {
      console.error("Error marking notifications as read:", err)
    }
  }

  // Fetch available channels dynamically
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const userId = localStorage.getItem("userId")
        const response = await fetch(`${chatURL}/auths/getAllUsers/${userId}`)

        if (!response.ok) {
          console.error("Error fetching channels:", response.statusText)
          return
        }

        const data = await response.json()

        // Get stored groups from localStorage
        const storedGroups = JSON.parse(localStorage.getItem("userGroups") || "[]")

        // Combine regular users with stored groups
        setChannels([...data, ...storedGroups])
      } catch (error) {
        console.error("Error fetching channels:", error.message)
      }
    }

    fetchChannels()
  }, [])

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = localStorage.getItem("userId")
        if (userId) {
          const response = await fetch(`${chatURL}/auths/getUser/${userId}`)
          if (response.ok) {
            const userData = await response.json()
            setUser(userData)
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }

    fetchUserData()
  }, [])

  // Fetch messages dynamically when a channel is selected
  useEffect(() => {
    if (!userId || !selectedChannel) return

    const fetchMessages = async () => {
      try {
        const response = await axios.post(`${chatURL}/messages/getmsg`, {
          from: userId,
          to: selectedChannel._id,
        })
        setMessages(response.data)
      } catch (error) {
        console.error("Error fetching messages:", error.response?.data || error.message)
      }
    }

    const fetchVoiceMessages = async () => {
      try {
        const response = await axios.get(`${chatURL}/messages/${userId}/${selectedChannel._id}`)
        setVoiceMessages(response.data)
      } catch (error) {
        console.error("Error fetching voice messages:", error.response?.data || error.message)
      }
    }

    fetchMessages()
    fetchVoiceMessages()

    const intervalId = setInterval(() => {
      fetchMessages()
      fetchVoiceMessages()
    }, 1000)

    return () => clearInterval(intervalId)
  }, [userId, selectedChannel])

  // Listen for real-time updates (Text & Voice Messages)
  useEffect(() => {
    socket.emit("join-chat", { userId })

    socket.on("msg-receive", ({ msg, from, groupId, isGroupMessage }) => {
      // If it's a group message, check if it's for the currently selected group
      if (isGroupMessage && groupId) {
        if (selectedChannel && selectedChannel._id === groupId) {
          setMessages((prev) => [...prev, { fromSelf: false, message: msg }])
        }
      } else {
        // Regular one-to-one message
        setMessages((prev) => [...prev, { fromSelf: false, message: msg }])
      }
    })

    socket.on("receive-voice-msg", ({ audioUrl, from }) => {
      const isFromSelf = from === userId
      console.log(`Voice message from ${from}, Current User ID: ${userId}, fromSelf: ${isFromSelf}`)
      setVoiceMessages((prev) => [...prev, { fromSelf: isFromSelf, audioUrl }])
    })

    return () => {
      socket.off("msg-receive")
      socket.off("receive-voice-msg")
    }
  }, [userId, selectedChannel])

  const startRecording = () => {
    setRecording(true)
    setRecordTime("0:00")

    let seconds = 0
    timerRef.current = setInterval(() => {
      seconds++
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      setRecordTime(`${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`)
    }, 1000)
  }

  const stopRecording = async (mediaBlobUrl) => {
    if (!mediaBlobUrl) {
      console.error("No audio recorded!")
      return
    }

    try {
      const response = await fetch(mediaBlobUrl)
      const blob = await response.blob()

      // Upload and send the audio file
      await uploadAudio(blob)

      // Reset the mediaBlobUrl to clear the input bar
      setMediaBlobUrl(null)
    } catch (error) {
      console.error("Error processing recorded audio:", error)
    }
  }

  const uploadAudio = async (blob) => {
    if (!blob || !(blob instanceof Blob)) {
      console.error("Invalid audio blob!")
      return
    }

    try {
      const formData = new FormData()
      formData.append("file", blob, "voice_note.mp3")
      formData.append("from", userId)
      formData.append("to", selectedChannel._id)

      const uploadResponse = await axios.post(`${chatURL}/messages/addvoice`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      // Emit the voice message with the sender's ID
      socket.emit("send-voice-msg", {
        to: selectedChannel._id,
        audioUrl: uploadResponse.data.audioUrl,
        from: userId,
      })

      // Mark as sent by the current user
      setVoiceMessages((prev) => [...prev, { fromSelf: true, audioUrl: uploadResponse.data.audioUrl }])
    } catch (error) {
      console.error("Error uploading audio:", error.response?.data || error.message)
    }
  }

  // Filter channels based on search input
  const filteredChannels = channels.filter((channel) => channel.username.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    const messagesContainer = messagesContainerRef.current
    if (!messagesContainer) return

    const handleScroll = () => {
      // Check if user has scrolled near the bottom
      const isUserAtBottom =
        messagesContainer.scrollHeight - messagesContainer.scrollTop <= messagesContainer.clientHeight + 50 // 50px threshold

      setIsAtBottom(isUserAtBottom)
    }

    messagesContainer.addEventListener("scroll", handleScroll)

    return () => messagesContainer.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (isAtBottom && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages]) // Runs when messages update

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  // Send a new message
  const sendMessage = async () => {
    // Ensure that we have either text or an emoji to send
    if (!newMessage.trim() && !emoji) return

    // Combine the emoji (if any) with the new message text
    const finalMessage = newMessage.trim() + emoji

    // Check if this is a group chat
    const isGroup = selectedChannel.isGroup

    if (isGroup) {
      // Emit the group message via socket.io for real-time update
      socket.emit("send-group-msg", {
        to: selectedChannel._id,
        msg: finalMessage,
        from: localStorage.getItem("userId"),
      })
    } else {
      // Regular one-to-one message
      socket.emit("send-msg", {
        to: selectedChannel._id,
        msg: finalMessage,
        from: localStorage.getItem("userId"),
      })
    }

    // Update the local messages state for the current user
    setMessages((prev) => [...prev, { fromSelf: true, message: finalMessage }])

    // Clear the message input fields
    setNewMessage("")
    setEmoji("") // Reset the emoji state after sending the message

    // Now store the message asynchronously in the database
    try {
      const messageData = {
        from: localStorage.getItem("userId"),
        to: selectedChannel._id,
        message: finalMessage,
      }

      await fetch(`${chatURL}/messages/addmsg`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
      })

      console.log("Message stored in DB")
    } catch (error) {
      console.error("Error storing message:", error)
    }
  }

  // Handle emoji selection
  const handleEmojiclick = (emojiObject) => {
    console.log("Selected emoji object:", emojiObject)
    if (emojiObject && emojiObject.emoji) {
      setNewMessage((prevMessage) => prevMessage + emojiObject.emoji)
      setShowEmojiPicker(false) // Hide the emoji picker after selecting an emoji
    } else {
      console.error("Invalid emoji object:", emojiObject)
    }
  }

  const toggleCalendar = () => setIsCalendarOpen(!isCalendarOpen)

  const handleDateChange = (date) => {
    setSelectedDate(date)
    setIsCalendarOpen(false) // Close the calendar modal after selecting a date
    console.log("Selected Date:", date) // For debugging
  } // Call this when the user comes online or changes channel

  const handleEditMessage = async (messageId) => {
    try {
      if (!editText.trim()) {
        console.error("Edit text cannot be empty")
        return
      }

      const response = await axios.put(`${chatURL}/messages/${messageId}`, {
        text: editText.trim(),
      })

      if (response.data) {
        // Update the messages state with the edited message
        setMessages((prevMessages) =>
          prevMessages.map((msg) => (msg._id === messageId ? { ...msg, message: editText.trim() } : msg)),
        )

        // Reset edit states
        setEditMessageId(null)
        setEditText("")
        setDropdownMessage(null)
      }
    } catch (error) {
      console.error("Error updating message:", error)
      alert("Failed to update message. Please try again.")
    }
  }

  // Delete a message
  const handleDeleteMessage = async (messageId) => {
    try {
      await axios.delete(`${chatURL}/messages/${messageId}`)
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId))
      setDropdownMessage(null)
    } catch (error) {
      console.error("Error deleting message:", error)
    }
  }

  const combinedMessages = [...messages, ...voiceMessages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

  const handleDeleteVoiceMessage = async (voiceMessageId) => {
    try {
      await axios.delete(`http://localhost:5000/api/messages/deletevoice/${voiceMessageId}`)

      // Remove from UI
      setVoiceMessages((prev) => prev.filter((msg) => msg._id !== voiceMessageId))
    } catch (error) {
      console.error("Error deleting voice message:", error.response?.data || error.message)
    }
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Add this function to handle adding members to a group
  const handleAddMembersToGroup = async () => {
    try {
      if (!groupToAddMembers || membersToAdd.length === 0) {
        alert("Please select members to add to the group")
        return
      }

      // Make API call to add members to the group
      const response = await axios.post(`${chatURL}/groups/addMembers`, {
        groupId: groupToAddMembers._id,
        newMembers: membersToAdd,
        addedBy: userId,
      })

      if (response.data) {
        // Update the group in localStorage
        const existingGroups = JSON.parse(localStorage.getItem("userGroups") || "[]")
        const updatedGroups = existingGroups.map((group) =>
          group._id === groupToAddMembers._id ? { ...group, members: [...group.members, ...membersToAdd] } : group,
        )
        localStorage.setItem("userGroups", JSON.stringify(updatedGroups))

        // Update the channels state
        setChannels((prevChannels) =>
          prevChannels.map((channel) =>
            channel._id === groupToAddMembers._id
              ? { ...channel, members: [...channel.members, ...membersToAdd] }
              : channel,
          ),
        )

        // Reset states
        setIsAddMembersMode(false)
        setGroupToAddMembers(null)
        setMembersToAdd([])

        alert("Members added successfully!")
      }
    } catch (error) {
      console.error("Error adding members to group:", error)
      alert("Failed to add members to group. Please try again.")
    }
  }

  return (
    <div className={`flex h-screen ${darkMode ? "dark" : ""}`}>
      {/* Sidebar */}
      <aside className="w-20 bg-gradient-to-br from-blue-300 to-gray-500 dark:from-gray-800 dark:to-gray-900 flex flex-col py-6 space-y-6 items-center">
        {/* Logged-in User Avatar */}
        <div className="flex flex-col items-center cursor-pointer relative">
          {/* Avatar Circle */}
          <div
            className="h-16 w-16 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xl"
            style={{
              backgroundColor: generateAvatar(user?.username || "U").backgroundColor,
            }}
            onClick={() => {
              const userInfoElement = document.getElementById("user-info-popup")
              if (userInfoElement) {
                userInfoElement.classList.toggle("hidden")
              }
            }}
          >
            {/* First letter */}
            {user?.username ? user.username.charAt(0).toUpperCase() : "?"}
          </div>

          {/* Username under the circle */}
          <span className="mt-2 text-sm text-white font-semibold max-w-[80px] truncate">
            {user?.username || "User"}
          </span>

          {/* User Info Popup */}
          <div
            id="user-info-popup"
            className="hidden absolute left-20 top-0 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg z-50 w-64"
          >
            <div className="text-gray-800 dark:text-gray-200">
              <h3 className="font-bold text-lg mb-2">User Profile</h3>
              <p className="mb-1">
                <span className="font-semibold">Username:</span> {user?.username || "User"}
              </p>
              <p>
                <span className="font-semibold">Email:</span> {userEmail || "No email"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <ChatBubbleLeftRightIcon className="h-8 w-8 text-white hover:text-gray-300 cursor-pointer" />
          <UserGroupIcon className="h-8 w-8 text-white hover:text-gray-300 cursor-pointer" />
          <BellIcon className="h-8 w-8 text-white hover:text-gray-300 cursor-pointer" onClick={toggleNotifications} />
          <CalendarDaysIcon
            className="h-8 w-8 text-white hover:text-gray-300 cursor-pointer"
            onClick={toggleCalendar}
          />
          <InboxArrowDownIcon className="h-8 w-8 text-white hover:text-gray-300 cursor-pointer" />
          <ArrowUpOnSquareIcon className="h-8 w-8 text-white hover:text-gray-300 cursor-pointer" />
        </div>
        <div className="flex-1"></div>
        <button className="h-8 w-8 text-white hover:text-gray-300 cursor-pointer" onClick={toggleDarkMode}>
          {darkMode ? <SunIcon /> : <MoonIcon />}
        </button>
        <button className="h-8 w-8 text-white hover:text-gray-300 cursor-pointer" onClick={() => navigate("/settings")}>
          <CogIcon />
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Channel List */}
        <section className="w-1/4 bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-700 p-4 flex flex-col h-full">
          {/* Header Section */}
          <div className="border-b border-gray-400 dark:border-gray-600 pb-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200">Chats</h2>
            {/* Three Dots Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                <EllipsisVerticalIcon className="w-6 h-6 text-gray-700 dark:text-gray-200" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden z-50">
                  <button
                    className="flex items-center px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 w-full"
                    onClick={() => {
                      setIsGroupCreationMode(true)
                      setMenuOpen(false)
                    }}
                  >
                    <UsersIcon className="w-5 h-5 mr-3" /> New Group
                  </button>
                  <button className="flex items-center px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 w-full">
                    <VideoCameraIcon className="w-5 h-5 mr-3" onClick={() => navigate("/CreateMeet")} /> Meet Link
                  </button>
                  <button className="flex items-center px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 w-full">
                    <ArchiveBoxIcon className="w-5 h-5 mr-3" /> Archived
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search channels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-2 w-full px-3 py-2 bg-gray-200 dark:bg-gray-600 rounded focus:outline-none"
          />

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto mt-4 space-y-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            <ul className="space-y-2">
              {filteredChannels.map((channel) => (
                <li
                  key={channel._id}
                  onClick={() => setSelectedChannel(channel)}
                  className={`cursor-pointer p-3 rounded-lg flex items-center shadow-md transition-transform duration-200 transform border w-full ${
                    selectedChannel?._id === channel._id
                      ? "bg-blue-500 text-white scale-105 shadow-lg"
                      : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-500 hover:scale-105"
                  }`}
                  style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
                    style={{ backgroundColor: generateAvatar(channel.username).backgroundColor }}
                  >
                    {generateAvatar(channel.username).initial}
                  </div>
                  <span className="ml-3 font-medium truncate w-full">{channel.username}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Group Creation UI */}
          {isGroupCreationMode && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-1/2 p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Create New Group</h3>

                <input
                  type="text"
                  placeholder="Group Name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-600 rounded focus:outline-none mb-4"
                />

                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Select Contacts:</h4>
                <div className="max-h-60 overflow-y-auto mb-4">
                  {filteredChannels.map((channel) => (
                    <div
                      key={channel._id}
                      className="flex items-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    >
                      <input
                        type="checkbox"
                        id={`user-${channel._id}`}
                        checked={selectedUsers.includes(channel._id)}
                        onChange={() => {
                          setSelectedUsers((prev) =>
                            prev.includes(channel._id)
                              ? prev.filter((id) => id !== channel._id)
                              : [...prev, channel._id],
                          )
                        }}
                        className="mr-3"
                      />
                      <label htmlFor={`user-${channel._id}`} className="flex items-center cursor-pointer">
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold shadow-sm mr-2"
                          style={{ backgroundColor: generateAvatar(channel.username).backgroundColor }}
                        >
                          {generateAvatar(channel.username).initial}
                        </div>
                        <span className="font-medium">{channel.username}</span>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    onClick={() => {
                      setIsGroupCreationMode(false)
                      setSelectedUsers([])
                      setGroupName("")
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                    disabled={selectedUsers.length < 2 || !groupName.trim()}
                    onClick={async () => {
                      try {
                        // Create group chat API call
                        const response = await axios.post(`http://localhost:5000/api/groups/create`, {
                          name: groupName,
                          members: [...selectedUsers, userId], // Include current user
                          createdBy: userId,
                        })

                        if (response.data) {
                          // Add the new group to channels
                          const newGroup = response.data

                          // Store the created group in localStorage
                          const existingGroups = JSON.parse(localStorage.getItem("userGroups") || "[]")
                          localStorage.setItem("userGroups", JSON.stringify([...existingGroups, newGroup]))

                          setChannels((prev) => [...prev, newGroup])
                          // Select the new group
                          setSelectedChannel(newGroup)
                          // Reset group creation state
                          setIsGroupCreationMode(false)
                          setSelectedUsers([])
                          setGroupName("")
                        }
                      } catch (error) {
                        console.error("Error creating group:", error)
                        alert("Failed to create group. Please try again.")
                      }
                    }}
                  >
                    Create Group
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Members to Group UI */}
          {isAddMembersMode && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-1/2 p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Add Members to {groupToAddMembers?.username || "Group"}
                </h3>

                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Select Contacts to Add:</h4>
                <div className="max-h-60 overflow-y-auto mb-4">
                  {filteredChannels
                    .filter(
                      (channel) =>
                        // Filter out users who are already in the group
                        !groupToAddMembers?.members?.includes(channel._id) &&
                        // Filter out the group itself
                        channel._id !== groupToAddMembers?._id,
                    )
                    .map((channel) => (
                      <div
                        key={channel._id}
                        className="flex items-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      >
                        <input
                          type="checkbox"
                          id={`add-user-${channel._id}`}
                          checked={membersToAdd.includes(channel._id)}
                          onChange={() => {
                            setMembersToAdd((prev) =>
                              prev.includes(channel._id)
                                ? prev.filter((id) => id !== channel._id)
                                : [...prev, channel._id],
                            )
                          }}
                          className="mr-3"
                        />
                        <label htmlFor={`add-user-${channel._id}`} className="flex items-center cursor-pointer">
                          <div
                            className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold shadow-sm mr-2"
                            style={{ backgroundColor: generateAvatar(channel.username).backgroundColor }}
                          >
                            {generateAvatar(channel.username).initial}
                          </div>
                          <span className="font-medium">{channel.username}</span>
                        </label>
                      </div>
                    ))}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    onClick={() => {
                      setIsAddMembersMode(false)
                      setGroupToAddMembers(null)
                      setMembersToAdd([])
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                    disabled={membersToAdd.length === 0}
                    onClick={handleAddMembersToGroup}
                  >
                    Add Members
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* <button className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 w-full shadow-md mt-2 sticky bottom-0" 
      chatId={selectedChannel._id} >Invite</button> */}
          {selectedChannel && <InviteButton chatId={selectedChannel._id} />}
        </section>

        {isNotificationsOpen && (
          <div className="absolute inset-y-0 right-0 w-[calc(100%-80px)] bg-white dark:bg-gray-900 flex flex-col p-6 z-50">
            <div className="flex justify-between items-center border-b pb-4 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Notifications</h3>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={toggleNotifications}
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {notifications.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">No notifications yet!</p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif._id}
                    className={`py-2 px-4 rounded-md ${notif.read ? "bg-gray-100" : "bg-yellow-100"}`}
                  >
                    <p className="text-gray-800 dark:text-gray-200">{notif.message}</p>
                    <small className="text-gray-500">{new Date(notif.timestamp).toLocaleString()}</small>
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
                    backgroundColor: generateAvatar(selectedChannel.username).backgroundColor,
                  }}
                >
                  {generateAvatar(selectedChannel.username).initial}
                </div>
                <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{selectedChannel.username}</h1>
              </div>
            ) : (
              <h1 className="text-lg font-semibold text-gray-500 dark:text-gray-400">Select a Channel</h1>
            )}
            {selectedChannel && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsCallActive(true)}
                  className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
                >
                  <PhoneIcon className="h-6 w-6 text-blue-500 cursor-pointer" />
                </button>
                <button className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100">
                  <VideoCameraIcon className="h-6 w-6 text-blue-500 cursor-pointer" />
                </button>
                <button
                  className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
                  onClick={() => {
                    // Only allow adding members to groups
                    if (selectedChannel && selectedChannel.isGroup) {
                      setGroupToAddMembers(selectedChannel)
                      setIsAddMembersMode(true)
                    } else {
                      alert("You can only add members to group chats")
                    }
                  }}
                >
                  <UserPlusIcon className="h-6 w-6 text-blue-500 cursor-pointer" />
                </button>

                <button
                  className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 relative"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (selectedChannel && selectedChannel.isGroup) {
                      const groupInfoElement = document.getElementById("group-info-popup")
                      if (groupInfoElement) {
                        groupInfoElement.classList.toggle("hidden")
                      }
                    }
                  }}
                >
                  <EllipsisVerticalIcon className="h-6 w-6 text-blue-500 cursor-pointer" />

                  {/* Group Info Popup */}
                  {selectedChannel && selectedChannel.isGroup && (
                    <div
                      id="group-info-popup"
                      className="hidden absolute right-0 top-8 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg z-50 w-64"
                    >
                      <div className="text-gray-800 dark:text-gray-200">
                        <h3 className="font-bold text-lg mb-2">Group Info</h3>
                        <p className="mb-3">
                          <span className="font-semibold">Group Name:</span> {selectedChannel.username}
                        </p>
                        <div className="mb-2">
                          <span className="font-semibold">Members:</span>
                          <div className="mt-2 max-h-40 overflow-y-auto">
                            {selectedChannel.members &&
                              selectedChannel.members.map((memberId) => {
                                const member = channels.find((c) => c._id === memberId)
                                return member ? (
                                  <div key={memberId} className="flex items-center py-1">
                                    <div
                                      className="h-6 w-6 rounded-full flex items-center justify-center text-white font-bold mr-2"
                                      style={{ backgroundColor: generateAvatar(member.username).backgroundColor }}
                                    >
                                      {generateAvatar(member.username).initial}
                                    </div>
                                    <span>{member.username}</span>
                                  </div>
                                ) : null
                              })}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (selectedChannel && selectedChannel.isGroup) {
                              setGroupToAddMembers(selectedChannel)
                              setIsAddMembersMode(true)
                              document.getElementById("group-info-popup").classList.add("hidden")
                            }
                          }}
                          className="mt-2 w-full px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
                        >
                          <UserPlusIcon className="h-4 w-4 mr-1" />
                          Add Members
                        </button>
                      </div>
                    </div>
                  )}
                </button>
              </div>
            )}
          </header>
          {/* Show GroupCall Component when isCallActive is true */}
          {isCallActive && (
            <VoiceCall
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
              selectedChannel={selectedChannel}
              onClose={() => setIsCallActive(false)}
            />
          )}

          {isCalendarOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-1/3 p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Select a Date</h3>
                <Calendar onChange={handleDateChange} value={selectedDate} className="react-calendar" />
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
          <div ref={messagesContainerRef} className="flex-1 p-6 overflow-y-auto">
            {selectedChannel ? (
              <div className="space-y-4">
                {combinedMessages.map((msg, index) => {
                  const isHovered = hoveredMessage === msg._id
                  const isEditing = editMessageId === msg._id
                  const isVoiceMessage = !!msg.audioUrl

                  return (
                    <div
                      key={msg._id || index}
                      className={`flex ${msg.fromSelf ? "justify-end" : "justify-start"} mb-4 relative`}
                      onMouseEnter={() => setHoveredMessage(msg._id)}
                      onMouseLeave={() => setHoveredMessage(null)}
                    >
                      <div
                        className={`p-3 rounded-lg shadow-md ${
                          msg.fromSelf ? "bg-blue-400 text-white" : "bg-white dark:bg-gray-700"
                        } ${isVoiceMessage ? "max-w-[350px] min-w-[250px] w-[30vw]" : "max-w-xs"}`} // Voice message container size adjusted
                      >
                        {isVoiceMessage ? (
                          <div className="flex items-center space-x-2 p-2 rounded-lg">
                            {/* Voice Message Audio */}
                            <audio controls src={msg.audioUrl} className="w-[250px] md:w-[320px] h-10 rounded-md" />

                            {/* Delete Icon for Voice Messages */}
                            {msg.fromSelf && (
                              <button
                                onClick={() => handleDeleteVoiceMessage(msg._id)}
                                className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500"
                              >
                                <TrashIcon className="h-6 w-6 text-red-500" />
                              </button>
                            )}
                          </div>
                        ) : isEditing ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault()
                              handleEditMessage(msg._id)
                            }}
                            className="w-full"
                          >
                            <input
                              type="text"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full p-2 text-black rounded"
                              autoFocus
                            />
                            <div className="flex justify-end mt-2 space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditMessageId(null)
                                  setEditText("")
                                }}
                                className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={!editText.trim()}
                                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                              >
                                Save
                              </button>
                            </div>
                          </form>
                        ) : (
                          <p>{msg.message}</p>
                        )}

                        {/* Hover Edit & Delete for Normal Messages */}
                        {isHovered && msg.fromSelf && !isEditing && !isVoiceMessage && (
                          <div className="absolute bottom-1 right-1">
                            <button
                              className="ml-2 p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDropdownMessage(dropdownMessage === msg._id ? null : msg._id)
                              }}
                            >
                              <ChevronUpIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            </button>

                            {dropdownMessage === msg._id && (
                              <div className="absolute -top-12 right-0 bg-gray-200 dark:bg-gray-600 p-2 rounded-md shadow-md z-50">
                                <button
                                  className="flex items-center space-x-1 p-1 hover:bg-gray-300 dark:hover:bg-gray-500 rounded w-full"
                                  onClick={() => {
                                    setEditMessageId(msg._id)
                                    setEditText(msg.message)
                                    setDropdownMessage(null)
                                  }}
                                >
                                  <PencilIcon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                                  <span className="text-sm">Edit</span>
                                </button>
                                <button
                                  className="flex items-center space-x-1 p-1 hover:bg-gray-300 dark:hover:bg-gray-500 rounded w-full"
                                  onClick={() => handleDeleteMessage(msg._id)}
                                >
                                  <TrashIcon className="h-4 w-4 text-red-500" />
                                  <span className="text-sm">Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No messages available.</p>
            )}

            {/* Render Polls Component When Plus Icon is Clicked */}
            {showPolls && <Polls />}
            <div className="chat-messages">{/* Messages will be displayed here */}</div>
          </div>

          {/* Input Section */}
          {selectedChannel && (
            <footer className="relative p-4 bg-gray-100 dark:bg-gray-700 border-t border-gray-400 dark:border-gray-600">
              <div className="flex items-center space-x-3">
                <PhotoIcon className="h-6 w-6 text-gray-400 hover:text-gray-600 cursor-pointer" />
                <ReactMediaRecorder
                  audio
                  onStop={stopRecording} // Automatically call stopRecording when recording stops
                  render={({ startRecording, stopRecording }) => (
                    <>
                      <button
                        onClick={() => {
                          if (isRecording) {
                            stopRecording() // Stop recording
                            clearInterval(intervalRef.current)
                            setRecordTime("0:00")
                          } else {
                            startRecording() // Start recording
                            let sec = 0
                            intervalRef.current = setInterval(() => {
                              sec++
                              setRecordTime(`${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`)
                            }, 1000)
                          }
                          setIsRecording(!isRecording)
                        }}
                        className={` h-6 w-6 ${isRecording ? "bg-red-500 rounded-full" : " text-gray-400"}`}
                      >
                        <MicrophoneIcon className="h-6 w-6 text-gray-400 hover:text-gray-600 cursor-pointer" />
                      </button>

                      {recordTime !== "0:00" && <span className="ml-2">{recordTime}</span>}
                    </>
                  )}
                />

                <FaceSmileIcon
                  className="h-6 w-6 text-gray-400 hover:text-gray-600 cursor-pointer"
                  onClick={handleEmojiPickerHideShow}
                />
                <PlusIcon
                  className="h-6 w-6 text-gray-400 hover:text-gray-600 cursor-pointer"
                  onClick={() => setShowPolls(true)}
                />
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

      {/* Add Members to Group UI */}
      {isAddMembersMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-1/2 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Add Members to Group</h3>

            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Select Contacts:</h4>
            <div className="max-h-60 overflow-y-auto mb-4">
              {filteredChannels
                .filter((channel) => !selectedChannel.members.includes(channel._id))
                .map((channel) => (
                  <div
                    key={channel._id}
                    className="flex items-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    <input
                      type="checkbox"
                      id={`user-${channel._id}`}
                      checked={membersToAdd.includes(channel._id)}
                      onChange={() => {
                        setMembersToAdd((prev) =>
                          prev.includes(channel._id) ? prev.filter((id) => id !== channel._id) : [...prev, channel._id],
                        )
                      }}
                      className="mr-3"
                    />
                    <label htmlFor={`user-${channel._id}`} className="flex items-center cursor-pointer">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold shadow-sm mr-2"
                        style={{ backgroundColor: generateAvatar(channel.username).backgroundColor }}
                      >
                        {generateAvatar(channel.username).initial}
                      </div>
                      <span className="font-medium">{channel.username}</span>
                    </label>
                  </div>
                ))}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                onClick={() => {
                  setIsAddMembersMode(false)
                  setGroupToAddMembers(null)
                  setMembersToAdd([])
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                disabled={membersToAdd.length === 0}
                onClick={handleAddMembersToGroup}
              >
                Add Members
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatApp

