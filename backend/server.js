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

// Import Student Model
const Student = require("./models/Student");

const app = express();

// ✅ Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));
app.use("/api", assignmentMarksRoutes);
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
 // 📌 PDF Processing (.pdf)
if (fileType === "application/pdf") {
  const pdfText = await pdfParse(req.file.buffer);
  console.log("📖 Extracted PDF Text:", pdfText.text);

  const lines = pdfText.text.split("\n");
  lines.forEach((line) => {
    const match = line.match(/(\d+\w+)\s+\w+\s+(\d+)/); // Extract RollNo & Marks
    if (match) {
      const rollNo = match[1].trim().toLowerCase(); // Convert to lowercase
      const marks = Number(match[2]);
      extractedMarks[rollNo] = marks;
    }
  });

  return res.json({ marks: extractedMarks });
}


    // 📌 Web Page Processing (.html)
    if (fileType === "text/html") {
      const htmlString = req.file.buffer.toString("utf-8");
      const dom = new JSDOM(htmlString);
      const document = dom.window.document;

      // Select the table from the webpage
      const table = document.querySelector("table");
      if (!table) {
        return res.status(400).json({ error: "No table found in HTML file" });
      }

      console.log("📜 Extracted HTML Table:", table.innerHTML);

      const rows = table.querySelectorAll("tr");
      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 2) {
          const rollNo = cells[0].textContent.trim();
          const marks = Number(cells[1].textContent.trim());
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
