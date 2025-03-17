const express = require("express");
const router = express.Router();
const AssignmentMark = require("../models/AssignmentMark"); // Import model

// Save Assignment Marks
router.post("/assignment-marks", async (req, res) => {
  try {
    const marksData = req.body;

    if (!Array.isArray(marksData) || marksData.length === 0) {
      return res.status(400).json({ error: "Invalid data format" });
    }

    for (const entry of marksData) {
      const { courseId, className, rollNo, assignmentId, marks, maxMarks } = entry;

      if (!courseId || !assignmentId || !rollNo) {
        console.error("Missing required fields:", entry);
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if mark entry already exists
      const existingEntry = await AssignmentMark.findOne({ courseId, assignmentId, rollNo });

      if (existingEntry) {
        existingEntry.marks = marks;
        await existingEntry.save(); // Update existing marks
      } else {
        const newEntry = new AssignmentMark({ courseId, className, rollNo, assignmentId, marks, maxMarks });
        await newEntry.save();
      }
    }

    res.json({ message: "Marks saved successfully" });
  } catch (error) {
    console.error("Error saving assignment marks:", error);
    res.status(500).json({ error: "Server error saving marks" });
  }
});



router.get("/assignment-marks/:courseId/:assignmentId", async (req, res) => {
  try {
    const { courseId, assignmentId } = req.params;

    console.log(`Fetching marks for courseId: ${courseId}, assignmentId: ${assignmentId}`);

    if (!courseId || !assignmentId) {
      return res.status(400).json({ error: "Course ID and Assignment ID are required" });
    }

    const marks = await AssignmentMark.find({ courseId, assignmentId });

    if (!marks.length) {
      console.log("No marks found in DB!");
      return res.status(404).json({ error: "No marks found for this assignment." });
    }

    console.log("Marks fetched from DB:", marks);
    res.json(marks);
  } catch (error) {
    console.error("Error fetching assignment marks:", error);
    res.status(500).json({ error: "Server error fetching marks" });
  }
});




module.exports = router;
