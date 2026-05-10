import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCiRTUSrEm7mxZ4Hzfb2iT3QevF9tZm6xA",
  authDomain: "tapisan-stb-g4-g7.firebaseapp.com",
  projectId: "tapisan-stb-g4-g7",
  storageBucket: "tapisan-stb-g4-g7.firebasestorage.app",
  messagingSenderId: "471944484216",
  appId: "1:471944484216:web:444b36f32ef52143c4a48d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
