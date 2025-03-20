const mongoose = require("mongoose");

const assessmentMarksSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    className: {
      type: String,
      required: true,
    },
    rollNo: {
      type: String,
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    assessmentId: {
      type: String, // "CA1" or "CA2"
      required: true,
    },
    marks: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const AssessmentMarks = mongoose.model("AssessmentMarks", assessmentMarksSchema);
module.exports = AssessmentMarks;
