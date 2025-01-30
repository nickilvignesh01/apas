const express = require("express");
const router = express.Router();
const Course = require("../models/Course");

// POST route to add a new course
router.post("/", async (req, res) => {
  try {
    const { courseName, courseType, numOfStudents, syllabus, duration, courseCode } = req.body;
    
    // Validate required fields
    if (!courseName || !courseCode) {
      return res.status(400).json({ error: "Course Name and Course Code are required" });
    }

    const newCourse = new Course({
      courseName,
      courseType,
      numOfStudents,
      syllabus: syllabus || 'default-url-or-placeholder', // Provide a default if empty
      duration,
      courseCode
    });

    await newCourse.save();
    res.status(201).json({ message: "Course added successfully", course: newCourse });
  } catch (error) {
    console.error("Error adding course:", error);
    res.status(500).json({ error: "Server error while adding course" });
  }
});

// GET: List all courses
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

// GET: Get course by ID
router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.status(200).json(course);
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
