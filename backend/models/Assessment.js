const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema(
  {
    numAssignments: {
      type: Number,
      required: true,
    },
    pdfUpload: {
      type: Boolean,
      required: true,
    },
    numTutorials: {
      type: Number,
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course", // Reference to the "Course" model
      required: true,
    },
  },
  { timestamps: true }
);

const Assessment = mongoose.model("Assessment", assessmentSchema);

module.exports = Assessment;
