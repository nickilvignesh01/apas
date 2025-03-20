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
const { JSDOM } = require("jsdom"); // For parsing HTML

// Import Routes
const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const classRoutes = require("./routes/classRoutes");
const studentRoutes = require("./routes/studentRoutes");
const markRoutes = require("./routes/marks");
const tutorialMarksRoutes = require("./routes/tutorialMarks");
const assignmentMarksRoutes = require("./routes/assignmentMarksRoutes");
const overallMarksRoutes = require("./routes/overallMarksRoutes");

// Import Student Model
const Student = require("./models/Student");

const app = express();

// ✅ Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));
app.use("/api", assignmentMarksRoutes);
app.use("/api/overall-marks", overallMarksRoutes);

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

app.post("/api/upload-students", upload.single("file"), async (req, res) => {
  if (!req.file) {
    console.error("❌ No file received.");
    return res.status(400).json({ error: "No file uploaded" });
  }

  console.log("📂 File uploaded:", req.file.originalname);
  const fileType = req.file.mimetype;
  console.log(`📂 Uploaded File Type: ${fileType}`);

  const className = req.body.className;
  if (!className) {
    console.error("❌ Missing className in request.");
    return res.status(400).json({ error: "Class name is required." });
  }

  let extractedStudents = [];

  try {
    if (fileType === "application/pdf") {
      const pdfText = await pdfParse(req.file.buffer);
      console.log("📖 Extracted PDF Text:", pdfText.text);

      const lines = pdfText.text.split("\n");
      lines.forEach((line) => {
        const match = line.match(/(\d+\w+)\s+([\w\s]+)\s+([\w.-]+@[\w.-]+)/);
        if (match) {
          const rollNo = match[1].trim().toLowerCase();
          const name = match[2].trim();
          const email = match[3].trim();
          extractedStudents.push({ rollNo, name, email, className });
        }
      });

      if (extractedStudents.length === 0) {
        console.error("❌ No students extracted from the PDF.");
        return res.status(400).json({ error: "No students found in the file." });
      }

      if (mongoose.connection.readyState !== 1) {
        console.error("❌ MongoDB is not connected!");
        return res.status(500).json({ error: "Database connection error." });
      }

      // ✅ Use `upsert` to avoid duplicate errors
      const bulkOps = extractedStudents.map((student) => ({
        updateOne: {
          filter: { rollNo: student.rollNo, className: student.className },
          update: { $set: student },
          upsert: true,
        },
      }));

      await Student.bulkWrite(bulkOps);
      console.log("✅ Students Saved or Updated");

      return res.json({ students: extractedStudents });
    } else {
      console.error("❌ Unsupported file type:", fileType);
      return res.status(400).json({ error: "Only PDF files are supported for student uploads" });
    }
  } catch (error) {
    console.error("❌ Error Processing File:", error);
    res.status(500).json({ error: "Error processing file" });
  }
});


/* 📌 API: Upload Marks from Excel, PDF, or Web Page */
app.post("/api/upload-marks", upload.single("file"), async (req, res) => {
  if (!req.file) {
    console.error("❌ No file received");
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileType = req.file.mimetype;
  console.log(`📂 Uploaded File Type: ${fileType}`);

  try {
    let extractedMarks = {};

    // 📌 Excel Processing (.xlsx, .xls)
    if (fileType.includes("spreadsheet") || fileType.includes("excel")) {
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);

      console.log("📊 Extracted Excel Data:", data);

      data.forEach((row) => {
        if (row["Roll No"] && row["Marks"]) {
          const rollNo = row["Roll No"].toString().trim();
          extractedMarks[rollNo] = Number(row["Marks"]);
        }
      });

      return res.json({ marks: extractedMarks });
    }

    // 📌 PDF Processing (.pdf)
    if (fileType === "application/pdf") {
      const pdfText = await pdfParse(req.file.buffer);
      console.log("📖 Extracted PDF Text:", pdfText.text);

      const lines = pdfText.text.split("\n");
      lines.forEach((line) => {
        const match = line.match(/(\d+\w+)\s+\w+\s+(\d+)/);
        if (match) {
          const rollNo = match[1].trim().toLowerCase();
          const marks = Number(match[2]);
          extractedMarks[rollNo] = marks;
        }
      });

      return res.json({ marks: extractedMarks });
    }

    return res.status(400).json({ error: "Only Excel, PDF, or HTML files are supported" });
  } catch (error) {
    console.error("❌ Error Processing File:", error);
    res.status(500).json({ error: "Error processing file" });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

module.exports = app;
