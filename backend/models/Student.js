const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  rollNo: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  className: { type: String, required: true }, // Store class name here
});

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;
