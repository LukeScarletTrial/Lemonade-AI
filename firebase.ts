import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyACB54lgs8iGLW6u3GYrsdHVa4PzlOn7gw",
  authDomain: "lemonade-ai-fd521.firebaseapp.com",
  projectId: "lemonade-ai-fd521",
  storageBucket: "lemonade-ai-fd521.firebasestorage.app",
  messagingSenderId: "554662770301",
  appId: "1:554662770301:web:cca21704315a4897fea314"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
console.log("Firebase initialized:", app.name);