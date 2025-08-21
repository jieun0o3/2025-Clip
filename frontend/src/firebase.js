import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
  apiKey: "AIzaSyAWbh-jUakDyrcakzax7fdwAbfyCL4nsHc",
  authDomain: "clip-8c9e0.firebaseapp.com",
  projectId: "clip-8c9e0",
  storageBucket: "clip-8c9e0.firebasestorage.app",
  messagingSenderId: "1035773016187",
  appId: "1:1035773016187:web:d9d3fa5b5ea1d25844cade"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);