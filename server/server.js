import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

// Load environment configurations
dotenv.config();

// Connect to MongoDB Database
connectDB();

const app = express();

// Global Middleware Configuration
app.use(cors());
app.use(express.json()); // Parses incoming raw JSON requests

// Root Health-Check Route
app.get('/', (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Khataverse Backend Engine API is running smoothly."
  });
});

// Fallback Global Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Khataverse Server firing up in ${process.env.NODE_ENV} mode on port ${PORT}`);
});