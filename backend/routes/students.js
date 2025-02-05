const express = require("express");
const router = express.Router();
const Student = require("../models/Student");

// Get students by className
router.get("/", async (req, res) => {
  try {
    console.log("Received Request:", req.query);

    const { className } = req.query;
    if (!className) {
      return res.status(400).json({ error: "Class name is required" });
    }

    const students = await Student.find({ className });

    if (students.length === 0) {
      return res.status(404).json({ message: "No students found for this class" });
    }

    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
