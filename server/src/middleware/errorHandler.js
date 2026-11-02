// errorHandler.js - Central error-handling middleware for Express
// Must have 4 parameters (err, req, res, next) for Express to treat it as an error handler

const errorHandler = (err, req, res, next) => {
  // Use the status code set on the error, or default to 500 (Internal Server Error)
  const statusCode = err.statusCode || 500;

  console.error(`[ERROR] ${err.message}`); // Log the error on the server side

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

module.exports = errorHandler;
