// /models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  department: { type: String },
  role: { type: String },
  uid: { type: String, required: true }, // Firebase UID
});

module.exports = mongoose.model("User", userSchema);
