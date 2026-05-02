import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "ai-interviewer-46f4e.firebaseapp.com",
  projectId: "ai-interviewer-46f4e",
  storageBucket: "ai-interviewer-46f4e.firebasestorage.app",
  messagingSenderId: "890879441652",
  appId: "1:890879441652:web:e5e19db1c2fcb96df47ca1"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export { auth, provider };