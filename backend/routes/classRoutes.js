const express = require("express");
const router = express.Router();
const Class = require("../models/Class");

// Create a new class
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    
    // Validate input: Ensure class name is provided and not just spaces
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Class name is required and cannot be empty" });
    }

    // Case-insensitive check for existing class (prevents duplicates)
    const existingClass = await Class.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") }
    });

    if (existingClass) {
      return res.status(400).json({ error: "Class with this name already exists" });
    }

    // Create new class
    const newClass = new Class({ name });
    await newClass.save();
    res.status(201).json(newClass);
  } catch (error) {
    console.error("Error creating class:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all classes
router.get("/", async (req, res) => {
  try {
    const classes = await Class.find();
    
    // Check if classes exist
    if (classes.length === 0) {
      return res.status(404).json({ message: "No classes found" });
    }

    res.json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
