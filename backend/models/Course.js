const mongoose = require("mongoose"); // Add this line to import mongoose

const courseSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: true,
  },
  courseType: {
    type: String,
    required: true,
  },
  numOfStudents: {
    type: Number,
    required: true,
  },
  syllabus: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  courseCode: {
    type: String,
    required: true,
  },
});

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
