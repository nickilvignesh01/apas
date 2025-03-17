// models/Student.js
const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({
  rollNo: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  className: { type: String, required: true },
}, { 
  indexes: [{ unique: true, fields: ['rollNo', 'className'] }]
});

module.exports = mongoose.model("Student", StudentSchema);
