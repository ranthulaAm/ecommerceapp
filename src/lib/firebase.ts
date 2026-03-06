import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB1nfzjqwb4nK7rEfIWm5auAy1LElQWIjM",
  authDomain: "ecommerce-app-like-fiverr.firebaseapp.com",
  projectId: "ecommerce-app-like-fiverr",
  storageBucket: "ecommerce-app-like-fiverr.firebasestorage.app",
  messagingSenderId: "339822546512",
  appId: "1:339822546512:web:0e4cdf4dadb40b1f488b55",
  measurementId: "G-JH6JHTLDZK"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, analytics, db, storage, auth };
