const express = require("express");
const router = express.Router();
const Assessment = require("../models/Assessment");

// POST: Add a new assessment
router.post("/", async (req, res) => {
  try {
    // Extract data from the request body
    const { numAssignments, pdfUpload, numTutorials, courseId } = req.body;

    // Validate the courseId
    if (!courseId) {
      return res.status(400).json({ error: "Course ID is required" });
    }

    // Create a new assessment object
    const newAssessment = new Assessment({
      numAssignments,
      pdfUpload,
      numTutorials,
      courseId,
    });

    // Save the new assessment to the database
    await newAssessment.save();

    // Return a success response with the newly created assessment
    res.status(201).json({
      message: "Assessment added successfully",
      assessment: newAssessment,
    });
  } catch (err) {
    console.error("Error adding assessment:", err);
    // Send a failure response if an error occurs
    res.status(500).json({ error: "Server error while adding assessment" });
  }
});

// GET: Fetch all assessments
router.get("/", async (req, res) => {
  try {
    // Retrieve all assessments and populate course details
    const assessments = await Assessment.find()
      .populate("courseId", "courseName courseCode"); // Populate course details with courseName and courseCode

    // Send back the list of assessments
    res.status(200).json(assessments);
  } catch (err) {
    console.error("Error fetching assessments:", err);
    // Send a failure response if an error occurs
    res.status(500).json({ error: "Server error while fetching assessments" });
  }
});

module.exports = router;
