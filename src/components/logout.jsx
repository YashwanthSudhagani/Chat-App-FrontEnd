import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const chatURL = "https://chat-app-backend-2ph1.onrender.com/api";

const useLogout = () => {
  const [error, setError] = useState(""); // State for handling errors
  const navigate = useNavigate();

  const handleLogout = async () => {
    setError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${chatURL}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      let data;

      // Try to parse the response as JSON
      try {
        data = await response.json();
      } catch (err) {
        console.error("Failed to parse JSON:", err);
        throw new Error("Invalid response from server.");
      }

      // Check if the response is successful
      if (!response.ok) {
        const errorMessage = data.msg || "Logout failed. Please try again.";
        setError(errorMessage);
        return;
      }

      // Logout successful, clear local storage
      localStorage.removeItem("token");
     
      alert("Logout successful!");
      navigate("/login"); // Redirect to login page
    } catch (err) {
      console.error("Error during logout:", err);
      setError("An error occurred while logging out. Please try again later.");
    }
  };

  return { handleLogout, error };
};

export default useLogout;
