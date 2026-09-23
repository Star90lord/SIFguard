const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", "backend", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

const getMongoUri = () => {
  return (
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/sifguard"
  ).trim();
};

const mongooseOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 2,
};

const connectdb = async () => {
  const MONGO_URI = getMongoUri();

  try {
    await mongoose.connect(MONGO_URI, mongooseOptions);
    console.log("MongoDB connected successfully at:", MONGO_URI.replace(/:[^:@]+@/, ":****@"));
    return mongoose.connection;
  } catch (error) {
    console.warn("MongoDB connection warning:", error.message);
    console.warn("Backend server will continue running with in-memory persistence.");
    return null;
  }
};

mongoose.connection.on("error", (error) => {
  console.warn("Mongoose connection warning:", error.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

module.exports = {
  connectdb,
};
