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
      if (!token) {
        setError("No authentication token found. Please log in.");
        return;
      }

      const response = await fetch(`${chatURL}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // ✅ Log full response for debugging
      console.log("Logout response status:", response.status);
      console.log("Logout response headers:", response.headers);

      let data;
      const contentType = response.headers.get("content-type");

      // ✅ Ensure response is JSON before parsing
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text(); // Read response as text
        console.warn("Non-JSON response:", text);
        throw new Error("Invalid response from server.");
      }

      // ✅ Check response status
      if (!response.ok) {
        const errorMessage = data?.msg || `Logout failed: ${response.statusText}`;
        setError(errorMessage);
        return;
      }

      // ✅ Logout successful, clear storage and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("user");

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
