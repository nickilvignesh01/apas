const express = require("express");
const router = express.Router();
const Student = require("../models/Student");

// Add a student to a class
// Add a student to a class
router.post("/", async (req, res) => {
    try {
      const { rollNo, name, email, className } = req.body;  // Ensure className is received in request body
      if (!rollNo || !name || !email || !className) {
        return res.status(400).json({ error: "All fields are required" });
      }
  
      // Check if a student with the same roll number exists in the same class
      const existingStudent = await Student.findOne({ rollNo, className });
      if (existingStudent) {
        return res.status(400).json({ error: "Student with this Roll No already exists in the class" });
      }
  
      // Check if a student with the same email exists (global check)
      const emailExists = await Student.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ error: "Student with this email already exists" });
      }
  
      // Create a new student and save to the correct class
      const newStudent = new Student({ rollNo, name, email, className });
      await newStudent.save();
      res.status(201).json(newStudent);
    } catch (error) {
      console.error("Error adding student:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  

// Get students by class
router.get("/", async (req, res) => {
  try {
    const { className } = req.query;
    if (!className) {
      return res.status(400).json({ error: "Class name is required" });
    }

    const students = await Student.find({ className });
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
