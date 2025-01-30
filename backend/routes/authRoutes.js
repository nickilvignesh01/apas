const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Add a new user
router.post('/register', async (req, res) => {
    console.log(req.body); // Log the incoming request body
  
    const { name, email, password } = req.body;
    try {
      const user = await User.create({ name, email, password });
      res.status(201).json(user);
    } catch (error) {
      console.error(error); // Log the error to debug
      res.status(400).json({ error: error.message });
    }
  });
  

// Get all users (for testing)
router.get('/', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

module.exports = router;
