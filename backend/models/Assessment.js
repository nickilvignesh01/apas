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

// Creating a model from the schema
const Assessment = mongoose.model("Assessment", assessmentSchema);

// Exporting the model so it can be used in the routes
module.exports = Assessment;
