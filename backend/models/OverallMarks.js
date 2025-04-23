const mongoose = require("mongoose");

const OverallMarksSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  rollNo: { type: String, required: true },
  studentName: { type: String, required: true },
  className: { type: String, required: true }, // Added className
  tutorial: { type: Number, required: true },
  assignment: { type: Number, required: true },
  ca1: { type: Number, required: true },
  ca2: { type: Number, required: true },
  caTotal: { type: Number, required: true },
  total: { type: Number, required: true },
});

module.exports = mongoose.model("OverallMarks", OverallMarksSchema);