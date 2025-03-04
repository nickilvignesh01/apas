require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const admin = require("firebase-admin");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const XLSX = require("xlsx");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const classRoutes = require("./routes/classRoutes");
const studentRoutes = require("./routes/studentRoutes");
const markRoutes = require("./routes/marks");
const tutorialMarksRoutes = require("./routes/tutorialMarks");

// Import Student Model
const Student = require("./models/Student"); // Ensure you have a Student model

const app = express();

// ✅ Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// ✅ Initialize Firebase Admin SDK
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
    setTimeout(connectDB, 5000);
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
app.use("/api/marks", markRoutes);
app.use("/api/tutorial-marks", tutorialMarksRoutes);

// ✅ Multer Storage for File Uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/* 📌 1️⃣ API: Upload Marks from Excel or PDF */
app.post("/api/upload-marks", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const fileType = req.file.mimetype;
  console.log(`📂 Uploaded File Type: ${fileType}`);

  try {
    let extractedMarks = {};

    // 📌 Excel Processing
    if (fileType.includes("spreadsheet") || fileType.includes("excel")) {
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);

      console.log("📊 Extracted Excel Data:", data);

      data.forEach((row) => {
        if (row["Roll No"] && row["Marks"]) {
          const rollNo = row["Roll No"].toString().trim().toLowerCase(); // Normalize roll number
          extractedMarks[rollNo] = Number(row["Marks"]);
        }
      });
    }

    // 📌 PDF Processing
    else if (fileType === "application/pdf") {
      const pdfData = await pdfParse(req.file.buffer);
      const text = pdfData.text;

      console.log("📄 Extracted PDF Text:\n", text);

      const lines = text.split("\n").map((line) => line.trim()).filter((line) => line);

      lines.forEach((line) => {
        const parts = line.split(/\s+/); // Split by spaces

        if (parts.length >= 3) {
          let rollNo = parts[0].trim().toLowerCase();
          const marks = parseInt(parts[2], 10); // Extracting the marks

          if (!isNaN(marks)) {
            extractedMarks[rollNo] = marks;
          }
        }
      });

      console.log("📊 Extracted Marks from PDF:", extractedMarks);
    } else {
      return res.status(400).json({ error: "Only Excel and PDF files are supported" });
    }

    res.json({ marks: extractedMarks });
  } catch (error) {
    console.error("❌ Error Processing File:", error);
    res.status(500).json({ error: "Error processing file" });
  }
});
app.post("/api/upload-students", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const className = req.body.className;
  if (!className) return res.status(400).json({ error: "Class name is required" });

  const fileType = req.file.mimetype;
  console.log(`📂 Uploaded File Type: ${fileType}`);

  try {
    let extractedStudents = [];

    if (fileType === "application/pdf") {
      const pdfData = await pdfParse(req.file.buffer);
      const text = pdfData.text;
      console.log("📄 Extracted PDF Text:\n", text);

      const lines = text.split("\n").map((line) => line.trim()).filter((line) => line);

      lines.forEach((line) => {
        const parts = line.split(/\s+/);
        if (parts.length >= 3) {
          let rollNo = parts[0].trim().toLowerCase();
          let name = parts[1].trim();
          let email = parts[2].trim();
          if (email.includes("@")) {
            extractedStudents.push({ rollNo, name, email, className });
          }
        }
      });

      console.log("📊 Extracted Students:", extractedStudents);
      if (extractedStudents.length > 0) {
        await Student.insertMany(extractedStudents, { ordered: false }).catch(err => {
          console.error("⚠️ Some students might already exist:", err);
        });
      }
    }

    res.json({ students: extractedStudents });
  } catch (error) {
    console.error("❌ Error Processing File:", error);
    res.status(500).json({ error: "Error processing file" });
  }
});


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

// ✅ Global Error Handling
app.use((err, req, res, next) => {
  console.error("❌ Global Error:", err.message);
  res.status(500).json({ error: "Internal Server Error" });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

module.exports = app;
