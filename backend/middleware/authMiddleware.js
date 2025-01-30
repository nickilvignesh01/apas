const admin = require("../firebaseAdmin");

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token after 'Bearer'

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const email = decodedToken.email;

    // Restrict access to specific email domain
    if (!email.endsWith("@psgtech.ac.in")) {
      return res.status(403).json({ error: "Access denied. Invalid email domain." });
    }

    req.user = decodedToken; // Attach user info to the request
    next(); // Proceed to the next middleware
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

module.exports = verifyToken;
