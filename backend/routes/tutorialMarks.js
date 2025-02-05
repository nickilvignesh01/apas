const express = require("express");
const router = express.Router();
const Mark = require("../models/Mark");
const CompletedTutorial = require("../models/CompletedTutorial");
const Student = require("../models/Student"); // Ensure Student model is imported

// 📌 Save Marks for a Tutorial (POST /api/tutorial-marks)
router.post("/", async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: "Invalid data format. Expected an array." });
    }

    // Save marks for each student
    const markPromises = req.body.map(async (mark) => {
      return Mark.create({
        courseId: mark.courseId,
        tutorialId: mark.tutorialId,
        className: mark.className,
        rollNo: mark.rollNo,
        marks: mark.marks,
        maxMarks: mark.maxMarks,
      });
    });

    await Promise.all(markPromises);
    res.status(201).json({ message: "Marks saved successfully!" });
  } catch (error) {
    console.error("Error saving marks:", error);
    res.status(500).json({ error: "Error saving marks" });
  }
});

// 📌 Mark a Tutorial as Completed (POST /api/tutorial-marks/complete-tutorial)
router.post("/complete-tutorial", async (req, res) => {
  const { courseId, tutorialId } = req.body;

  try {
    // Save the completed tutorial in CompletedTutorial model
    await CompletedTutorial.create({ courseId, tutorialId });

    res.status(200).json({ message: "Tutorial marked as completed" });
  } catch (error) {
    console.error("Error marking tutorial as completed:", error);
    res.status(500).json({ error: "Failed to mark tutorial as completed" });
  }
});

// 📌 Fetch Completed Tutorials (GET /api/tutorial-marks/completed/:courseId)
router.get("/completed/:courseId", async (req, res) => {
  const { courseId } = req.params;
  try {
    const completedTutorials = await CompletedTutorial.find({ courseId }).distinct("tutorialId");
    res.json(completedTutorials);
  } catch (error) {
    console.error("Error fetching completed tutorials:", error);
    res.status(500).json({ error: "Error fetching completed tutorials" });
  }
});

// 📌 Get Marks for a Course (GET /api/tutorial-marks/:courseId)
router.get("/:courseId", async (req, res) => {
  const { courseId } = req.params;
  try {
    const marks = await Mark.find({ courseId }).populate("courseId", "courseName");

    // Fetch student names based on roll numbers
    const studentRollNumbers = marks.map(mark => mark.rollNo);
    const students = await Student.find({ rollNo: { $in: studentRollNumbers } }, "rollNo name");

    // Create a mapping of rollNo to studentName
    const studentMap = {};
    students.forEach(student => {
      studentMap[student.rollNo] = student.name;
    });

    // Attach student names to marks data
    const marksWithStudentNames = marks.map(mark => ({
      tutorialId: mark.tutorialId,
      rollNo: mark.rollNo,
      studentName: studentMap[mark.rollNo] || "Unknown", // Default if name is missing
      marks: mark.marks,
      maxMarks: mark.maxMarks
    }));

    res.json(marksWithStudentNames);
  } catch (error) {
    console.error("Error fetching marks:", error);
    res.status(500).json({ error: "Error fetching marks" });
  }
});

module.exports = router;
