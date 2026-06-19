import { initializeApp } from "firebase/app";
import { initializeAuth } from "firebase/auth";
import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";

const { getReactNativePersistence } = require('@firebase/auth/dist/rn') as any;

const firebaseConfig = {
  apiKey: "AIzaSyBHUZ5kZhblIHRf9Ky3eI68Q9a3JWbtCeY",
  authDomain: "trabalhomayara-c9f9a.firebaseapp.com",
  projectId: "trabalhomayara-c9f9a",
  storageBucket: "trabalhomayara-c9f9a.firebasestorage.app",
  messagingSenderId: "1069691256582",
  appId: "1:1069691256582:web:923cf75c4c646cb0b9e887"
};


const app = initializeApp(firebaseConfig);
const persistence = getReactNativePersistence(createAsyncStorage("app"));
const auth = initializeAuth(app, { persistence });
const db = getFirestore(app);

export { auth, db };