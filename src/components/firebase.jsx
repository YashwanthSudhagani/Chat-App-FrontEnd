import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth"
import axios from "axios"

// const API_URL = "http://localhost:5000/api"
const API_URL = "http://localhost:5000/api"

const firebaseConfig = {
  apiKey: "AIzaSyDwFEYC-XWGFX5KZabcIoTUjIbyFhg9Mc8",
  authDomain: "signup-c1513.firebaseapp.com",
  projectId: "signup-c1513",
  storageBucket: "signup-c1513.appspot.com",
  messagingSenderId: "595125195153",
  appId: "1:595125195153:web:b7c357d9c58744598e0a30",
  measurementId: "G-WB97HR045H",
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const provider = new GoogleAuthProvider()

const saveUserToDatabase = async (user) => {
  try {
    await axios.post(`${API_URL}/users`, {
      email: user.email,
      displayName: user.displayName,
      uid: user.uid,
    })
    console.log("User saved to database")
  } catch (error) {
    console.error("Error saving user to database:", error)
  }
}

const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider)
    // Save user to database after successful login
    await saveUserToDatabase(result.user)
    return result.user
  } catch (error) {
    console.error("Google Sign-In Error:", error)
    throw error
  }
}

const logout = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    console.error("Logout Error:", error)
    throw error
  }
}

export { auth, signInWithGoogle, logout, API_URL }
