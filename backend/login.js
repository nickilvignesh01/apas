const express = require("express");
const bodyParser = require("body-parser");
const validateUser = require("./validateUser");  // Import the validation function

const app = express();
app.use(bodyParser.json());

// Login route to validate user credentials
app.post("/login", async (req, res) => {
  const { email, password } = req.body;  // Get email and password from the request body

  if (!email || !password) {
    return res.status(400).json({ error: "Email and Password are required." });
  }

  const isValid = await validateUser(email, password); // Validate user credentials

  if (isValid) {
    return res.status(200).json({ message: "Login successful" });  // Successful login
  } else {
    return res.status(401).json({ error: "Invalid email or password" });  // Invalid credentials
  }
});

module.exports = app;
