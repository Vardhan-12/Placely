// authMiddleware.js - Protects routes by verifying the JWT

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// protect: checks the Authorization header, verifies the token, loads the user
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Token must be in the format: "Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "No token provided. Please log in.",
    });
  }

  const token = authHeader.split(" ")[1]; // Extract the token part

  try {
    // Verify the token and decode the payload ({ id, role })
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Load the user from the database (exclude password)
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      // Token was valid but the user was deleted from the DB
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }

    req.user = user; // Attach user to the request so the next handler can use it
    next();
  } catch (err) {
    // jwt.verify throws if the token is invalid or expired
    return res.status(401).json({
      success: false,
      message: "Token is invalid or has expired. Please log in again.",
    });
  }
};

module.exports = { protect };
