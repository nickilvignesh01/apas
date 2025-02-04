const express = require("express");
const router = express.Router();
const Assessment = require("../models/Assessment");

// POST: Add a new assessment
router.post("/", async (req, res) => {
  try {
    const { numAssignments, pdfUpload, numTutorials, courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: "Course ID is required" });
    }

    const newAssessment = new Assessment({
      numAssignments,
      pdfUpload,
      numTutorials,
      courseId,
    });

    await newAssessment.save();

    res.status(201).json({
      message: "Assessment added successfully",
      assessment: newAssessment,
    });
  } catch (err) {
    console.error("Error adding assessment:", err);
    res.status(500).json({ error: "Server error while adding assessment" });
  }
});

// GET: Fetch all assessments
router.get("/", async (req, res) => {
  try {
    const assessments = await Assessment.find().populate("courseId", "courseName courseCode");

    res.status(200).json(assessments);
  } catch (err) {
    console.error("Error fetching assessments:", err);
    res.status(500).json({ error: "Server error while fetching assessments" });
  }
});

module.exports = router;
