import express from "express";
import cors from "cors";
import "dotenv/config";
import job from "./lib/cron.js";

import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";

import { connectDB } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Start cron jobs
job.start();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(cors());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);

// ✅ Connect to MongoDB first
connectDB()
  .then(() => {
    console.log("MongoDB connected");

    // Then start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
  });
