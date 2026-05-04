// firebaseConfig.js

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

import {
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';

import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDtuSgejE0csOqxRW7oJUAZWKLbQxAd6FU",
  authDomain: "med-app-3ed84.firebaseapp.com",
  projectId: "med-app-3ed84",
  storageBucket: "med-app-3ed84.firebasestorage.app",
  messagingSenderId: "906197511609",
  appId: "1:906197511609:web:32480c29137bd4bda15a68",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// 🔥 AUTH BIEN CONFIGURADO (CLAVE)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore
export const db = getFirestore(app);

export default app;