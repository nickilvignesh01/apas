const express = require("express");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/protected", verifyToken, (req, res) => {
  res.status(200).json({
    message: "Access granted to protected route!",
    user: req.user, // Firebase user info
  });
});

module.exports = router;
