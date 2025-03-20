const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({
  rollNo: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  className: { type: String, required: true },
}, { timestamps: true });

// ✅ Ensure Unique Constraint (MongoDB Index)
StudentSchema.index({ rollNo: 1, className: 1 }, { unique: true });

module.exports = mongoose.model("Student", StudentSchema);
