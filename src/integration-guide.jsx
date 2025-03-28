"use client"

// This file shows how to integrate the group chat functionality into your existing ChatApp component

// 1. First, import the CreateGroup and GroupChatView components at the top of your ChatApp.jsx file
import CreateGroup from "./components/CreateGroup"
import GroupChatView from "./components/GroupChatView"
import { useState, useEffect } from "react"
import axios from "axios" // Import axios
import { UsersIcon, VideoCameraIcon, ArchiveBoxIcon, UserGroupIcon } from "@heroicons/react/24/solid" // Or wherever it's imported from
import { useRouter } from "next/navigation"

// Assuming these are defined elsewhere in your application
const chatURL = process.env.NEXT_PUBLIC_CHAT_URL || "http://localhost:3000" // Example chat URL
const userId = "someUserId" // Example userId

// 2. Add these new state variables to your existing state in ChatApp component
const [showCreateGroup, setShowCreateGroup] = useState(false)
const [activeGroup, setActiveGroup] = useState(null)
const [groups, setGroups] = useState([])
const [menuOpen, setMenuOpen] = useState(false) // Example state for menuOpen
const socket = null // Example socket variable

// 3. Add a useEffect to fetch user's groups
useEffect(() => {
  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${chatURL}/groups/user/${userId}`)
      setGroups(response.data)
    } catch (error) {
      console.error("Error fetching groups:", error)
    }
  }

  if (userId) {
    fetchGroups()
  }
}, [userId])

// 4. Add these new handler functions to your ChatApp component
const handleOpenCreateGroup = () => {
  setShowCreateGroup(true)
}

const handleCloseCreateGroup = (newGroup) => {
  setShowCreateGroup(false)
  if (newGroup) {
    // Add the new group to the list
    setGroups((prev) => [...prev, newGroup])
  }
}

const handleOpenGroup = (group) => {
  setActiveGroup(group)
}

const handleBackFromGroup = () => {
  setActiveGroup(null)
}

// 1. First, import the GroupChat component at the top of your ChatApp.jsx file
import GroupChat from "./components/GroupChat"
import GroupChatInterface from "./components/GroupChatInterface"
// import { UserGroupIcon } from "@heroicons/react/24/solid" // Or wherever it's imported from

// Assuming socket and userId are passed as props or come from context
// You might need to adjust this based on your actual implementation
// const socket = useContext(SocketContext); // Example using context
// const userId = useContext(UserContext); // Example using context

// 2. Add these new state variables to your existing state in ChatApp component
const [showGroupChat, setShowGroupChat] = useState(false)
const [selectedGroupChat, setSelectedGroupChat] = useState(null)

// 3. Add these new handler functions to your ChatApp component
const handleOpenGroupChat = () => {
  setShowGroupChat(true)
}

const handleCloseGroupChat = (group) => {
  setShowGroupChat(false)
  if (group) {
    setSelectedGroupChat(group)
  }
}

const handleBackToChats = () => {
  setSelectedGroupChat(null)
}

// 4. Modify your render method to include the group chat components
// Add this to your sidebar section, in the space-y-6 div with the icons:
;<UserGroupIcon className="h-8 w-8 text-white hover:text-gray-300 cursor-pointer" onClick={handleOpenGroupChat} />

// 5. Add these components at the end of your return statement, just before the final closing div
{
  showGroupChat && <GroupChat onClose={handleCloseGroupChat} socket={socket} userId={userId} />
}

{
  selectedGroupChat && !showGroupChat && (
    <div className="absolute inset-0 z-40 bg-white dark:bg-gray-900">
      <GroupChatInterface group={selectedGroupChat} onBack={handleBackToChats} socket={socket} userId={userId} />
    </div>
  )
}

const navigate = useRouter()

// 5. Modify the "New Group" button in your existing code to call handleOpenCreateGroup
// Find this section in your code (around line 937):
{
  menuOpen && (
    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden z-50">
      <button
        className="flex items-center px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 w-full"
        onClick={handleOpenCreateGroup} // Add this onClick handler
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
  )
}

// 6. Add a section to display groups in your chat list
// Add this after your existing filteredChannels.map section:
{
  groups.length > 0 && (
    <>
      <div className="mt-6 mb-2">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Groups</h3>
      </div>
      <ul className="space-y-2">
        {groups.map((group) => (
          <li
            key={group._id}
            onClick={() => handleOpenGroup(group)}
            className={`cursor-pointer p-3 rounded-lg flex items-center shadow-md transition-transform duration-200 transform border w-full
            bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-500 hover:scale-105`}
            style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
              style={{ backgroundColor: generateAvatar(group.name).backgroundColor }}
            >
              {generateAvatar(group.name).initial}
            </div>
            <span className="ml-3 font-medium truncate w-full">{group.name}</span>
          </li>
        ))}
      </ul>
    </>
  )
}

// 7. Add these components at the end of your return statement, just before the final closing div
{
  showCreateGroup && <CreateGroup onClose={handleCloseCreateGroup} socket={socket} userId={userId} />
}

{
  activeGroup && (
    <div className="absolute inset-0 z-40 bg-white dark:bg-gray-900">
      <GroupChatView group={activeGroup} onBack={handleBackFromGroup} socket={socket} userId={userId} />
    </div>
  )
}

function generateAvatar(name) {
  const colors = ["#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#34495e", "#f1c40f", "#e67e22", "#e74c3c", "#95a5a6"]
  const nameHash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const backgroundColor = colors[nameHash % colors.length]
  const initial = name.charAt(0).toUpperCase()

  return {
    backgroundColor,
    initial,
  }
}

