const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  courseName: { type: String, required: true },
  courseType: { type: String, required: true },
  numOfStudents: { type: Number, required: true },
  syllabus: { type: String, required: true },
  duration: { type: String, required: true },
  courseCode: { type: String, required: true },
});

module.exports = mongoose.model("Course", courseSchema);
