// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDfKp8Bv_NVvlFwEiyi7RhQNN_n5adeiCM",
  authDomain: "saakhi-roommate-app.firebaseapp.com",
  projectId: "saakhi-roommate-app",
  storageBucket: "saakhi-roommate-app.firebasestorage.app",
  messagingSenderId: "167629681350",
  appId: "1:167629681350:web:2f8c2f721e2e55d95f1dc7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
