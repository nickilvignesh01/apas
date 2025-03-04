require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const admin = require("firebase-admin");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const classRoutes = require("./routes/classRoutes");
const studentRoutes = require("./routes/studentRoutes");
const markRoutes = require("./routes/marks"); // 📌 New route for Marks
const tutorialMarksRoutes = require('./routes/tutorialMarks');

const app = express();

// ✅ Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Supports form data
app.use("/uploads", express.static("uploads"));

// ✅ Initialize Firebase Admin SDK (Only if Key is Available)
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
  console.warn("⚠️ WARNING: FIREBASE_ADMIN_KEY is missing in .env");
}

// ✅ MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/academicDB";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    setTimeout(connectDB, 5000); // Retry connection after 5 seconds
  }
};

connectDB();

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/course", courseRoutes);
app.use("/api/assessment", assessmentRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/marks", markRoutes); // 📌 New route for Mark Entry
app.use('/api/tutorial-marks', tutorialMarksRoutes); // 📌 New route for Tutorial Marks

// ✅ Serve Static Files in Production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client", "build")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("🚀 API is running");
  });
}


app.use((err, req, res, next) => {
  console.error("❌ Global Error:", err.message);
  res.status(500).json({ error: "Internal Server Error" });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

module.exports = app;
