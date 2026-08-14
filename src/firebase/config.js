import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCioM3O_3T72CZgbSBDICBOcIx8guZpwig",
  authDomain: "attendace-863f6.firebaseapp.com",
  projectId: "attendace-863f6",
  storageBucket: "attendace-863f6.firebasestorage.app",
  messagingSenderId: "815990575525",
  appId: "1:815990575525:web:4347e05aae5ac4464fd84c",
  measurementId: "G-X47FX6JM33"
};

const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const db = getFirestore(app);

