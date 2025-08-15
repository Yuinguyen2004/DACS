// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDi_OrDkGCmSN3yIw0HyLHN3h-njSJdcA4",
  authDomain: "dacs-ffa3b.firebaseapp.com",
  projectId: "dacs-ffa3b",
  storageBucket: "dacs-ffa3b.firebasestorage.app",
  messagingSenderId: "529424604089",
  appId: "1:529424604089:web:12a1295e68a4704c6cb468",
  measurementId: "G-BQPTMM2NTJ"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

export default app