// roleMiddleware.js - Restricts routes to specific user roles

// authorizeRoles: accepts any number of allowed roles and returns a middleware function
// Usage: authorizeRoles("admin", "senior")
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // req.user is set by the protect middleware before this runs
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This route is for: ${roles.join(", ")}. Your role: ${req.user.role}.`,
      });
    }
    next();
  };
};

module.exports = { authorizeRoles };
