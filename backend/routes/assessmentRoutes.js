const express = require("express");
const router = express.Router();
const AssessmentMarks = require("../models/AssessmentMarks");

// ✅ POST: Save assessment marks
router.post("/marks", async (req, res) => {
  try {
    const marksData = req.body;
    if (!Array.isArray(marksData) || marksData.length === 0) {
      return res.status(400).json({ error: "Invalid or empty marks data" });
    }

    await Promise.all(
      marksData.map(async (data) => {
        await AssessmentMarks.findOneAndUpdate(
          {
            courseId: data.courseId,
            className: data.className,
            rollNo: data.rollNo,
            assessmentId: data.assessmentId,
          },
          { $set: data },
          { upsert: true, new: true }
        );
      })
    );

    res.status(201).json({ message: "Marks saved successfully!" });
  } catch (err) {
    console.error("❌ Error saving marks:", err);
    res.status(500).json({ error: "Server error while saving marks" });
  }
});

// ✅ GET: Fetch marks for an assessment & course
router.get("/marks", async (req, res) => {
  try {
    const { courseId, assessmentId } = req.query;
    if (!courseId || !assessmentId) {
      return res.status(400).json({ error: "Missing courseId or assessmentId" });
    }

    const marks = await AssessmentMarks.find({ courseId, assessmentId });
    res.status(200).json(marks);
  } catch (err) {
    console.error("❌ Error fetching marks:", err);
    res.status(500).json({ error: "Server error while fetching marks" });
  }
});

module.exports = router;
