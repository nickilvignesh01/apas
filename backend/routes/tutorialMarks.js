const express = require("express");
const router = express.Router();
const Mark = require("../models/Mark");
const CompletedTutorial = require("../models/CompletedTutorial");
const Student = require("../models/Student");

// 📌 Save Marks for a Tutorial (POST /api/tutorial-marks)
router.post("/", async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: "Invalid data format. Expected an array." });
    }

    // Validate and save marks for each student
    const markPromises = req.body.map(async (mark) => {
      if (!mark.courseId || !mark.tutorialId || !mark.className || !mark.rollNo || mark.marks == null || mark.maxMarks == null) {
        throw new Error(`Invalid mark entry: ${JSON.stringify(mark)}`);
      }
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
    console.log("Fetching marks for course:", courseId);

    // Fetch all marks for the given course
    const marks = await Mark.find({ courseId }).lean();
    console.log("Raw marks data:", marks.slice(0, 3)); // Log sample for debugging

    // Fetch student names based on roll numbers
    const studentRollNumbers = marks.map((mark) => mark.rollNo);
    console.log("Student roll numbers:", studentRollNumbers);

    const students = await Student.find({ rollNo: { $in: studentRollNumbers } }, "rollNo name").lean();

    // Create a mapping of rollNo to studentName
    const studentMap = {};
    students.forEach((student) => {
      studentMap[student.rollNo] = student.name;
    });

    // Include all required fields, including className
    const marksWithStudentNames = marks.map((mark) => ({
      tutorialId: mark.tutorialId,
      className: mark.className, // Include className
      rollNo: mark.rollNo,
      studentName: studentMap[mark.rollNo] || "Unknown",
      marks: mark.marks,
      maxMarks: mark.maxMarks,
    }));

    console.log("Processed marks (sample):", marksWithStudentNames.slice(0, 3));
    res.json(marksWithStudentNames);
  } catch (error) {
    console.error("Error fetching marks:", error);
    res.status(500).json({ error: "Error fetching marks" });
  }
});

// 📌 Delete All Tutorials & Marks for a Course (DELETE /api/tutorial-marks/:courseId)
router.delete("/:courseId", async (req, res) => {
  const { courseId } = req.params;

  try {
    const marksResult = await Mark.deleteMany({ courseId });
    const completedResult = await CompletedTutorial.deleteMany({ courseId });

    if (marksResult.deletedCount === 0 && completedResult.deletedCount === 0) {
      return res.status(404).json({ error: "No tutorials found to delete" });
    }

    res.json({ message: "All tutorials and related data deleted successfully" });
  } catch (error) {
    console.error("Error deleting tutorials:", error);
    res.status(500).json({ error: "Failed to delete tutorials" });
  }
});

// 📌 Get All Students for a Course (GET /api/students/:courseId)
router.get("/students/:courseId", async (req, res) => {
  const { courseId } = req.params;
  try {
    const students = await Student.find({ courseId }, "_id name rollNo");
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Error fetching students" });
  }
});

// 📌 Get Marks for a Specific Tutorial (GET /api/tutorial-marks/:courseId/:tutorialId)
router.get("/:courseId/:tutorialId", async (req, res) => {
  const { courseId, tutorialId } = req.params;
  try {
    const marks = await Mark.find({ courseId, tutorialId }).lean();

    const studentRollNumbers = marks.map((mark) => mark.rollNo);
    console.log("Student roll numbers:", studentRollNumbers);

    const students = await Student.find({ rollNo: { $in: studentRollNumbers } }, "rollNo name").lean();

    const studentMap = {};
    students.forEach((student) => {
      studentMap[student.rollNo] = student.name;
    });

    const marksWithStudentNames = marks.map((mark) => ({
      className: mark.className, // Include className
      rollNo: mark.rollNo,
      studentName: studentMap[mark.rollNo] || "Unknown",
      marks: mark.marks,
      maxMarks: mark.maxMarks,
    }));

    res.json(marksWithStudentNames);
  } catch (error) {
    console.error("Error fetching marks:", error);
    res.status(500).json({ error: "Error fetching marks" });
  }
});

module.exports = router;