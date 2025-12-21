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

// Middleware - IMPORTANT: Configure CORS first
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

// CRITICAL FIX: Configure body parser BEFORE routes
// Increase payload size limit to 50MB
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf, encoding) => {
    req.rawBody = buf.toString();
  }
}));

app.use(express.urlencoded({ 
  limit: '50mb', 
  extended: true,
  parameterLimit: 50000 // Increase parameter limit
}));

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

// Test endpoint for large payloads
app.post("/api/test-large-payload", (req, res) => {
  const payloadSize = JSON.stringify(req.body).length;
  console.log(`Received payload of ${payloadSize} bytes`);
  res.status(200).json({
    success: true,
    message: `Received payload of ${payloadSize} bytes`,
    maxAllowed: "50MB"
  });
});

// Catch-all for undefined routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware - MUST BE LAST
app.use((err, req, res, next) => {
  console.error("Server error:", err.name, err.message);
  
  // Handle PayloadTooLargeError
  if (err.type === 'entity.too.large' || err.name === 'PayloadTooLargeError') {
    return res.status(413).json({
      success: false,
      message: "Request payload too large. Maximum size is 50MB.",
      error: err.message
    });
  }
  
  // Handle other errors
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Payload size limit: 50MB`);
  connectDB();
});