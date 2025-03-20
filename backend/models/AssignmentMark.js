const mongoose = require("mongoose");

const assignmentMarkSchema = new mongoose.Schema({
  courseId: String,
  className: String,
  assignmentId: String,
  rollNo: String,
  marks: Number,
  maxMarks: Number,
});

module.exports = mongoose.model("AssignmentMark", assignmentMarkSchema);
