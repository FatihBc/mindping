import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyD2s4Kteer_hYyQdCyOYcrfhI6KpdKYMyE",
  authDomain: "mindping-53c7a.firebaseapp.com",
  projectId: "mindping-53c7a",
  storageBucket: "mindping-53c7a.firebasestorage.app",
  messagingSenderId: "896311514509",
  appId: "1:896311514509:web:012b9c65cb7f28a10359c4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
