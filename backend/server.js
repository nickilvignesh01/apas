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
const { JSDOM } = require("jsdom");
const nodemailer = require("nodemailer");

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

// Debug environment variables to confirm .env loading
console.log("Environment variables loaded:", {
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS ? "[REDACTED]" : undefined,
  MONGO_URI: process.env.MONGO_URI,
  FIREBASE_ADMIN_KEY: process.env.FIREBASE_ADMIN_KEY ? "[REDACTED]" : undefined,
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));
app.use("/api", assignmentMarksRoutes);
app.use("/api/overall-marks", overallMarksRoutes);

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
  console.warn("⚠️ WARNING: FIREBASE_ADMIN_KEY is missing in .env");
}

// MongoDB Connection
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

// Nodemailer Setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify Nodemailer on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Nodemailer verification failed:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
  } else {
    console.log("✅ Nodemailer ready to send emails");
  }
});

// Multer Storage for File Uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/course", courseRoutes);
app.use("/api/assessment", assessmentRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/marks", markRoutes);
app.use("/api/tutorial-marks", tutorialMarksRoutes);

// Upload Students API
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
          const email = `${rollNo}@psgtech.ac.in`; // Use rollNo@psgtech.ac.in
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
    console.error("❌ Error Processing File:", {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ error: "Error processing file" });
  }
});

// Upload Marks API
app.post("/api/upload-marks", upload.single("file"), async (req, res) => {
  if (!req.file) {
    console.error("❌ No file received");
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileType = req.file.mimetype;
  console.log(`📂 Uploaded File Type: ${fileType}`);

  try {
    let extractedMarks = {};

    if (fileType.includes("spreadsheet") || fileType.includes("excel")) {
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);

      console.log("📊 Extracted Excel Data:", data);

      data.forEach((row) => {
        const rollNo = row["ROLL NO"]?.toString().trim().toLowerCase();
        const marks = row["MARKS (out of 15)"];

        if (rollNo && !isNaN(marks)) {
          extractedMarks[rollNo] = Number(marks);
        }
      });

      return res.json({ marks: extractedMarks });
    }

    if (fileType === "application/pdf") {
      const pdfText = await pdfParse(req.file.buffer);
      console.log("📖 Extracted PDF Text:", pdfText.text);

      const lines = pdfText.text.split("\n");

      lines.forEach((line) => {
        const cleaned = line.trim().replace(/\s+/g, " ");
        const parts = cleaned.split(" ");

        if (parts.length >= 3) {
          const rollNo = parts[0].toLowerCase();
          const marks = Number(parts[parts.length - 1]);

          if (!isNaN(marks)) {
            extractedMarks[rollNo] = marks;
          }
        }
      });

      console.log("✅ Extracted Marks:", extractedMarks);
      return res.json({ marks: extractedMarks });
    }

    return res.status(400).json({ error: "Only Excel, PDF, or HTML files are supported" });
  } catch (error) {
    console.error("❌ Error Processing File:", {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ error: "Error processing file" });
  }
});

// Email Sending API
app.post("/api/send-email", upload.single("pdf"), async (req, res) => {
  try {
    const { emailId, studentName, rollNo, targetMainMark } = req.body;
    const pdf = req.file;

    // Log incoming request data
    console.log("📩 Received email request:", { emailId, studentName, rollNo, targetMainMark, pdf: !!pdf });

    // Validate inputs
    if (!emailId || !studentName || !rollNo || !targetMainMark || !pdf) {
      console.error("❌ Missing required fields or PDF", {
        emailId,
        studentName,
        rollNo,
        targetMainMark,
        pdf: !!pdf,
      });
      return res.status(400).json({ error: "Missing required fields or PDF" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailId)) {
      console.error("❌ Invalid email format", { emailId });
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Verify Nodemailer configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ Email configuration missing", {
        emailUser: !!process.env.EMAIL_USER,
        emailPass: !!process.env.EMAIL_PASS,
      });
      return res.status(500).json({ error: "Email service configuration missing" });
    }

    // Nodemailer mail options
    const mailOptions = {
      from: `"psg(test mail)" <${process.env.EMAIL_USER}>`,
      to: emailId,
      subject: `Performance Report for ${studentName} (${rollNo})`,
      text: `Dear ${studentName},\n\nAttached is your performance report. To pass the course, you need to score at least ${targetMainMark}/100 in the main exam (including a safety buffer of 10 marks).\n\nBest regards,\n staff `,
      attachments: [
        {
          filename: `Individual_Report_${rollNo}.pdf`,
          content: pdf.buffer,
          contentType: "application/pdf",
        },
      ],
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${emailId} for ${studentName} (${rollNo})`);
    return res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("❌ Error sending email:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
      emailId: req.body.emailId,
      rollNo: req.body.rollNo,
    });
    return res.status(500).json({ error: "Failed to send email", details: error.message || "Internal server error" });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

module.exports = app;