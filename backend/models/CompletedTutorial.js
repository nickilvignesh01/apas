const mongoose = require("mongoose");

const CompletedTutorialSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  tutorialId: { type: String, required: true },
});

module.exports = mongoose.model("CompletedTutorial", CompletedTutorialSchema);
