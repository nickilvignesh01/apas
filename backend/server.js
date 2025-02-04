require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");
const admin = require("firebase-admin");

const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const classRoutes = require("./routes/classRoutes"); // New route for classes
const studentRoutes = require("./routes/studentRoutes"); // New route for students

dotenv.config(); // Load environment variables

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Form data support
app.use("/uploads", express.static("uploads"));

// Initialize Firebase Admin SDK
if (process.env.FIREBASE_ADMIN_KEY) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_KEY)),
    });
    console.log("✅ Firebase Admin Initialized");
  } catch (error) {
    console.error("❌ Firebase Admin Initialization Failed:", error);
  }
} else {
  console.warn("⚠️ FIREBASE_ADMIN_KEY is not set in the environment variables.");
}

// MongoDB Connection with Retry Logic
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/academicDB";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ Error connecting to MongoDB:", err);
    setTimeout(connectDB, 5000); // Retry after 5 seconds
  }
};

connectDB();

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/course", courseRoutes);
app.use("/api/assessment", assessmentRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/classes", classRoutes); // New route for classes
app.use("/api/students", studentRoutes); // New route for students

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client", "build")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("🚀 API is running...");
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err.message);
  res.status(500).json({ error: "Internal Server Error" });
});

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
