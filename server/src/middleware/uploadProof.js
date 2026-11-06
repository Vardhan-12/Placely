// uploadProof.js - Multer middleware for senior proof document uploads

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../../uploads/proofs");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Disk storage: random crypto filenames, never the original name
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const randomName = crypto.randomBytes(16).toString("hex") + ext;
    cb(null, randomName);
  },
});

// File filter: accept only application/pdf, image/jpeg, image/png
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error("Invalid file type. Only PDF, JPG, and PNG files are allowed.");
    err.status = 400;
    cb(err, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
  fileFilter,
});

// Wrapper middleware to handle multer errors gracefully with clean 400 responses
const uploadProofSingle = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  // If not multipart, skip multer so JSON parser/body is untouched
  if (!contentType.includes("multipart/form-data")) {
    return next();
  }

  upload.single("proof")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Proof file size exceeds the 5 MB limit.",
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || "Failed to upload proof file.",
      });
    }
    next();
  });
};

module.exports = {
  uploadProofSingle,
  uploadDir,
};

