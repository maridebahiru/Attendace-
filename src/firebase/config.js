import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase Setup:
// 1. Enable Firestore in test mode
// 2. Collections:
//    - students -> doc ID = phone -> fields: name, phone, idNo, createdAt
//    - attendance -> doc ID = phone_YYYY-MM-DD -> fields: studentName, phone, date, scannedAt

const firebaseConfig = {
  apiKey: "AIzaSyALEOBJcUQNM2Y6GK1_rSXkh6d7x7Gk-X4",
  authDomain: "attendace-67816.firebaseapp.com",
  projectId: "attendace-67816",
  storageBucket: "attendace-67816.firebasestorage.app",
  messagingSenderId: "695627313669",
  appId: "1:695627313669:web:81260241687853db06a26c",
  measurementId: "G-9FQJ2KC0DK"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
