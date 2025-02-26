import axios from "axios";
import { useNavigate } from "react-router-dom";

 const chatURL="https://chat-app-backend-2ph1.onrender.com/api"

const useLogout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `${chatURL}/logout`, // ✅ API URL
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`, // ✅ Fix: Proper template literal syntax
          },
        }
      );

      if (response.status === 200) {
        // Remove token & user data
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        alert("Logout successful!");

        navigate("/login"); // ✅ Navigate to login page
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return handleLogout;
};

export default useLogout;
