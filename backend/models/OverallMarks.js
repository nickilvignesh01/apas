const mongoose = require("mongoose");

const OverallMarksSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  rollNo: { type: String, required: true },
  studentName: { type: String, required: true },
  tutorial: { type: Number, required: true }, // Out of 15
  assignment: { type: Number, required: true },
  ca1: { type: Number, required: true },
  ca2: { type: Number, required: true },
  caTotal: { type: Number, required: true }, // (CA1 + CA2) / 2
  total: { type: Number, required: true }, // Final Total Marks
});

module.exports = mongoose.model("OverallMarks", OverallMarksSchema);
