import axios from "axios";
import { useNavigate } from "react-router-dom";

const chatURL = "https://chat-app-backend-2ph1.onrender.com/api";

const useLogout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Check if localStorage is available (for SSR safety)
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) {
        alert("No user logged in.");
        navigate("/login");
        return;
      }

      const response = await axios.post(
        `${chatURL}/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        // Clear user session data
        localStorage.removeItem("token");
        localStorage.removeItem("username");

        alert("Logout successful!");
        navigate("/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("Logout failed. Please try again.");
    }
  };

  return handleLogout;
};

export default useLogout;
