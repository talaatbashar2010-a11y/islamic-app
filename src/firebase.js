import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; 

// إعدادات مشروعك في Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCU2wQ-RYXZ2-fOTD8UJeA9kRVLtAsF0ZY",
  authDomain: "islamic-app-c2549.firebaseapp.com",
  projectId: "islamic-app-c2549",
  storageBucket: "islamic-app-c2549.firebasestorage.app",
  messagingSenderId: "648913504510",
  appId: "1:648913504510:web:5659c9291144a05f86bdaf",
  measurementId: "G-K2Q6NJYBP9"
};

// تهيئة التطبيق وقاعدة البيانات
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// تصدير قاعدة البيانات لاستخدامها في باقي ملفات المشروع
export { app, db };