const express = require("express");
const OverallMarks = require("../models/OverallMarks");

const router = express.Router();

// ✅ Save Overall Internals Marks
router.post("/save", async (req, res) => {
  try {
    const { students, courseId } = req.body;

    if (!students || students.length === 0) {
      return res.status(400).json({ error: "No student data provided" });
    }

    // ✅ Convert student data into DB format
    const marksData = students.map((student) => ({
      courseId,
      rollNo: student.rollNo,
      studentName: student.studentName,
      tutorial: student.tutorial,
      assignment: student.assignment,
      ca1: student.ca1,
      ca2: student.ca2,
      caTotal: student.caTotal,
      total: student.total,
    }));

    // ✅ Remove old data for this course (to avoid duplicates)
    await OverallMarks.deleteMany({ courseId });

    // ✅ Insert new data
    await OverallMarks.insertMany(marksData);
    res.json({ message: "Marks saved successfully!" });

  } catch (error) {
    console.error("❌ Error saving marks:", error);
    res.status(500).json({ error: "Server error while saving marks" });
  }
});

// ✅ Fetch Saved Marks
router.get("/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    const marks = await OverallMarks.find({ courseId });

    if (!marks.length) {
      return res.status(404).json({ error: "No marks found for this course" });
    }

    res.json(marks);
  } catch (error) {
    console.error("❌ Error fetching marks:", error);
    res.status(500).json({ error: "Server error while fetching marks" });
  }
});

module.exports = router;
