import { db } from './firebase.js'; // Correct path to firebase.js
import { setDoc, doc } from 'firebase/firestore'; // Firestore methods
import bcrypt from 'bcryptjs'; // Password hashing library
console.log(process.env.REACT_APP_FIREBASE_API_KEY);  // Should print the API key in terminal

// Sample users to store (admin provides these details)
const users = [
  { email: "user1@example.com", password: "user1password" },
  { email: "user2@example.com", password: "user2password" },
  // Add more users here
];

async function storeUserCredentials() {
  for (const user of users) {
    // Hash the password before storing it in Firestore
    const hashedPassword = await bcrypt.hash(user.password, 10);

    // Store email and hashed password in Firestore 'users' collection
    await setDoc(doc(db, "users", user.email), {
      email: user.email,
      password: hashedPassword,
    });

    console.log(`Stored credentials for ${user.email}`);
  }
}

storeUserCredentials();
