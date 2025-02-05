const mongoose = require('mongoose');

const MarkSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  tutorialId: { type: String, required: true },
  className: { type: String, required: true },
  rollNo: { type: String, required: true },
  marks: { type: Number, required: true },
  maxMarks: { type: Number, required: true },
});

module.exports = mongoose.model('Mark', MarkSchema);
