// db.js - Connects to MongoDB using Mongoose
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // Log the error clearly so the developer knows what went wrong
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1); // Exit the process so the server doesn't run without a DB
  }
};

module.exports = connectDB;
