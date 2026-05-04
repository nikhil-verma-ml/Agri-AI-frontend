import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBarml8DfdYetciBzKFoB4-MkwCEmhPyMI",
  authDomain: "myauthapp-e9639.firebaseapp.com",
  projectId: "myauthapp-e9639",
  storageBucket: "myauthapp-e9639.firebasestorage.app",
  messagingSenderId: "858615101749",
  appId: "1:858615101749:web:07af4f7242363aa49a747c",
  measurementId: "G-XE422NF9RN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
