const bcrypt = require("bcryptjs");
const { db } = require("../firebase-admin"); // Import Firestore

// Validate user by checking credentials against Firestore
const validateUser = async (email, password) => {
  try {
    const userDoc = await db.collection("users").doc(email).get(); // Check if user exists

    if (!userDoc.exists) {
      throw new Error("User not found");
    }

    const userData = userDoc.data();
    const isPasswordValid = await bcrypt.compare(password, userData.password); // Compare entered password with hashed password

    if (isPasswordValid) {
      return true; // Valid credentials
    } else {
      throw new Error("Invalid password");
    }
  } catch (error) {
    console.error("Login validation error:", error.message);
    return false; // Invalid credentials
  }
};

module.exports = validateUser;
