// verifiedMiddleware.js - Blocks unverified users from accessing certain routes

// requireVerified: used for routes that seniors need verification to access
// Must run AFTER protect (so req.user exists)
const requireVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: "Your account is not verified yet. Please wait for admin verification.",
    });
  }
  next();
};

module.exports = { requireVerified };
