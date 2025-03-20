// routes/studentRoutes.js
const express = require("express");
const router = express.Router();
const Student = require("../models/Student");

// Add Student
router.post("/", async (req, res) => {
  try {
    const { rollNo, name, email, className } = req.body;
    if (!rollNo || !name || !email || !className) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingStudent = await Student.findOne({ rollNo, className });
    if (existingStudent) {
      return res.status(400).json({ error: "Student with this Roll No already exists in the class" });
    }

    const newStudent = new Student({ rollNo, name, email, className });
    await newStudent.save();
    res.status(201).json(newStudent);
  } catch (error) {
    console.error("Error adding student:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Fetch Students by Class Name
router.get("/", async (req, res) => {
  try {
    const { className } = req.query;
    if (!className) {
      return res.status(400).json({ error: "Class name is required" });
    }

    const students = await Student.find({ className });
    console.log("Fetched Students:", students);
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;