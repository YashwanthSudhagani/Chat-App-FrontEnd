import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const socket = io("http://localhost:5000");

export default function Polls({ openPoll }) {
    const [polls, setPolls] = useState([]);
    const [showModal, setShowModal] = useState(openPoll);
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState([]);
    const userId = localStorage.getItem("userId");
  
    useEffect(() => {
      axios.get("http://localhost:5000/api/polls/Getpoll").then((res) => setPolls(res.data));
      socket.on("new_poll", (poll) => setPolls((prev) => [poll, ...prev]));
      socket.on("poll_updated", (updatedPoll) => {
        setPolls((prev) => prev.map((p) => (p._id === updatedPoll._id ? updatedPoll : p)));
      });
      socket.on("poll_deleted", (pollId) => {
        setPolls((prev) => prev.filter((p) => p._id !== pollId));
      });
    }, []);
  
    // Fix: Define the vote function
    const vote = (pollId, optionId) => {
      socket.emit("vote", { pollId, optionId, userId });
    };
  
    // Fix: Define the deletePoll function
    const deletePoll = (pollId, createdBy) => {
      if (createdBy === userId) {
        socket.emit("delete_poll", { pollId, userId });
      }
    };
  
    const createPoll = () => {
      axios.post("http://localhost:5000/api/polls/Sendpoll", { question, options, createdBy: userId });
      setShowModal(false);
    };
  
    return (
      <div className="p-4">
        {/* Poll Creation Modal */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
              <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Poll question" />
              {options.map((opt, index) => (
                <Input
                  key={index}
                  value={opt.text}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[index].text = e.target.value;
                    setOptions(newOptions);
                  }}
                  placeholder="Option"
                />
              ))}
              <Button onClick={() => setOptions([...options, { id: uuidv4(), text: "" }])}>+ Add Option</Button>
              
              {/* Buttons */}
              <div className="flex justify-end mt-4 space-x-2">
                <Button onClick={() => setShowModal(false)} className="bg-gray-400 hover:bg-gray-500">
                  Cancel
                </Button>
                <Button onClick={createPoll}>Send Poll</Button>
              </div>
            </div>
          </div>
        )}
  
        {/* Poll List */}
        {polls.map((poll) => (
          <div key={poll._id} className={`flex ${poll.createdBy === userId ? 'justify-end' : 'justify-start'}`}>
            <Card className={`${poll.createdBy === userId ? 'bg-blue-200' : 'bg-gray-200'} p-4 rounded-lg`}>
              <CardContent>
                <h3>{poll.question}</h3>
                {poll.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <span>{option.text}</span>
                    <span>{option.voters.length}</span>
                    <Button onClick={() => vote(poll._id, option.id)}>Vote</Button>
                  </div>
                ))}
                {poll.createdBy === userId && (
                  <Button className="mt-2 bg-red-500 hover:bg-red-600" onClick={() => deletePoll(poll._id, poll.createdBy)}>
                    Delete Poll
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    );
  }
  
// Button Component
const Button = ({ children, onClick, className = "", ...props }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Input Component
const Input = ({ value, onChange, placeholder, className = "", ...props }) => {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      {...props}
    />
  );
};

// Card Component
const Card = ({ children, className = "" }) => {
  return (
    <div className={`bg-white shadow-md rounded-lg p-4 ${className}`}>
      {children}
    </div>
  );
};

// CardContent Component
const CardContent = ({ children, className = "" }) => {
  return <div className={`p-2 ${className}`}>{children}</div>;
};
