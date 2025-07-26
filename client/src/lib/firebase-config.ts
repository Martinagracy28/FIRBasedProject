// Firebase configuration for client-side
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCay3BXq3iq4iHR6V2whRXBlMzagSk2Akc",
  authDomain: "hackthon-5b62a.firebaseapp.com",
  databaseURL: "https://hackthon-5b62a-default-rtdb.firebaseio.com",
  projectId: "hackthon-5b62a",
  storageBucket: "hackthon-5b62a.firebasestorage.app",
  messagingSenderId: "137987828166",
  appId: "1:137987828166:web:cf7ce4c9898dea53dceac7",
  measurementId: "G-97ZB6Q612E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const db = getDatabase(app);

// Initialize Analytics (only in browser environment)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { app };