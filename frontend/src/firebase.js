import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  updateProfile 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Function to Sign in with Google
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    console.log("Google User:", user);

    // Ensure profile picture is available
    if (!user.photoURL) {
      console.warn("No profile picture available. Updating with default.");
      await updateProfile(user, {
        photoURL: "https://via.placeholder.com/150", // Default fallback image
      });
    }
  } catch (error) {
    console.error("Google Sign-In Error:", error);
  }
};

// Function to update profile (for email/password users)
const updateUserProfile = async (user) => {
  if (user && !user.photoURL) {
    await updateProfile(user, {
      photoURL: "https://via.placeholder.com/150", // Default profile picture
    });
    console.log("Profile updated with a default picture!");
  }
};

export { auth, db, signInWithEmailAndPassword, signInWithGoogle, updateUserProfile, googleProvider };
