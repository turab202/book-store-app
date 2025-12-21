import express from "express";
import cors from "cors";
import "dotenv/config";
import job from "./lib/cron.js";

import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";

import { connectDB } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Start cron job
job.start();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

// Increase payload size limit (FIX FOR PayloadTooLargeError)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    service: "book-store-api"
  });
});

// Catch-all for undefined routes (FIX FOR 404 errors)
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  
  // Handle PayloadTooLargeError specifically
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: "Request payload too large. Maximum size is 10MB."
    });
  }
  
  // Handle other errors
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});