// User.js - Mongoose model for Placely users

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,       // MongoDB creates a unique index automatically
      lowercase: true,    // Stored in lowercase regardless of what the user types
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Never returned in query results by default (must be explicitly requested)
    },

    role: {
      type: String,
      enum: {
        values: ["junior", "senior", "admin"],
        message: "Role must be junior, senior, or admin",
      },
      default: "junior",
    },

    isVerified: {
      type: Boolean,
      // Seniors need manual verification; juniors and admins are auto-verified
      // Kept in sync with verificationStatus: true only when approved
    },

    proofFile: {
      type: String, // stored filename in uploads/proofs
    },

    proofUploadedAt: {
      type: Date,
    },

    verificationStatus: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected"],
        message: "Status must be pending, approved, or rejected",
      },
    },

    rejectionReason: {
      type: String,
      trim: true,
    },

    branch: {
      type: String,
      trim: true,
    },

    placedCompany: {
      type: String,
      trim: true,
    },

    placedYear: {
      type: Number,
    },

    bookmarks: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Experience",
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

// --- Pre-save Hook ---
// Runs before every .save() call
// In Mongoose 8, pre hooks are async functions — do NOT use next() callback
userSchema.pre("save", async function () {
  // Sync verification status & isVerified
  if (this.isNew) {
    if (this.role === "senior") {
      this.verificationStatus = this.verificationStatus || "pending";
      this.isVerified = this.verificationStatus === "approved";
    } else {
      this.verificationStatus = "approved";
      this.isVerified = true;
    }
  } else {
    if (this.role === "senior") {
      // If verificationStatus is set, sync isVerified
      if (this.verificationStatus) {
        this.isVerified = this.verificationStatus === "approved";
      } else {
        // For backwards compatibility with existing records
        this.verificationStatus = this.isVerified ? "approved" : "pending";
      }
    } else {
      this.isVerified = true;
      this.verificationStatus = "approved";
    }
  }

  // Only hash the password if it has been changed (or is new)
  // This prevents re-hashing on unrelated updates (e.g., updating name)
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10); // 10 rounds is a good balance of security and speed
  this.password = await bcrypt.hash(this.password, salt);
});

// --- Instance Method ---
// Compares a plain-text password with the stored hash
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
