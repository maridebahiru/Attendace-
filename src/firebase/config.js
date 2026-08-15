import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDXzeSElbY-N4h_aFT-k1tLDIYVVFZ70zI",
  authDomain: "attendace-a7258.firebaseapp.com",
  projectId: "attendace-a7258",
  storageBucket: "attendace-a7258.firebasestorage.app",
  messagingSenderId: "694091372107",
  appId: "1:694091372107:web:2b27eb290e951ff343dfce",
  measurementId: "G-T223QDE7S3"
};

const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const db = getFirestore(app);


