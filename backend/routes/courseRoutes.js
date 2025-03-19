const express = require("express");
const multer = require("multer");
const Course = require("../models/Course");

const router = express.Router();

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure 'uploads/' directory exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// POST: Add a new course with syllabus file upload
router.post("/", upload.single("syllabus"), async (req, res) => {
  try {
    const { courseName, courseType, numOfStudents, startDate, endDate, duration, courseCode } = req.body;

    // Log for debugging the request body
    console.log("Request Body:", req.body);
    console.log("Syllabus file:", req.file);

    // Validate required fields
    if (!courseName || !courseCode || !startDate || !endDate || !duration || !req.file) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Create the new course
    const newCourse = new Course({
      courseName,
      courseType,
      numOfStudents,
      syllabus: req.file.path, // Store the uploaded file path
      startDate,
      endDate,
      duration,
      courseCode,
    });

    await newCourse.save();
    res.status(201).json({ message: "Course added successfully", course: newCourse });
  } catch (error) {
    console.error("Error adding course:", error.message, error.stack);
    res.status(500).json({ error: "Server error while adding course" });
  }
});

// GET: List all courses
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: "Server error while fetching courses" });
  }
});


// GET: Get course by ID (including syllabus file path)
router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.status(200).json(course); // Return course details with syllabus path
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ error: "Server error while fetching course" });
  }
});

// DELETE: Remove a course by ID
router.delete("/:id", async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ error: "Server error while deleting course" });
  }
});

module.exports = router;
