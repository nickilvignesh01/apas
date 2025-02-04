import { db } from "./firebase";
import { setDoc, doc } from "firebase/firestore";
import bcrypt from "bcryptjs";

async function storeUserCredentials(email, plainPassword) {
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  await setDoc(doc(db, "users", email), {
    email: email,
    password: hashedPassword
  });

  console.log(`User ${email} added successfully!`);
}

// Add multiple users
storeUserCredentials("23mx330@psgtech.ac.in", "23mx330@staff");
storeUserCredentials("example@psgtech.ac.in", "password123");
