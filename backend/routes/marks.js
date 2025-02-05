const express = require("express");
const router = express.Router();
const Mark = require("../models/Mark");

// Save or Update Marks for a Tutorial
router.post("/", async (req, res) => {
  try {
    const { courseId, tutorialId, rollNo, marks, maxMarks } = req.body;

    if (marks > maxMarks) {
      return res.status(400).json({ error: "Marks cannot exceed max marks" });
    }

    // Check if the record exists (Update if found, otherwise create new)
    let markEntry = await Mark.findOne({ courseId, tutorialId, rollNo });

    if (markEntry) {
      markEntry.marks = marks;
      await markEntry.save();
    } else {
      markEntry = new Mark({ courseId, tutorialId, rollNo, marks, maxMarks });
      await markEntry.save();
    }

    res.status(201).json(markEntry);
  } catch (error) {
    console.error("Error saving marks:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
