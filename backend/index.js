import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import transactionRoutes from "./routes/transactionRoutes.js";
import { swaggerSpec } from "./utils/swagger.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";


import path from 'path';
import { fileURLToPath } from "url";


dotenv.config();

const app = express();
app.set("trust proxy", 1);

const PORT = process.env.PORT || 6001;

// Middleware
app.use(helmet());
app.use(express.json());
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175"
  ]
}));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
  })
);

// Swagger documentation
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/tasks", taskRoutes);


// server frontend in production

if (process.env.NODE_ENV === "production") {

    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    app.use(express.static(path.join(__dirname, '../frontend/dist')));

    // Serve the frontend app

    app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
    });


    // app.get(/.*/, (req, res) => {
    //     res.send(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
    // })
}



// Test route
app.get("/api", (req, res) => {
  res.json({
    message: "Server is running",
  });
});

// Start server after MongoDB connects
const startServer = async () => {
  try {
    const mongoUri =
      process.env.NODE_ENV === "development"
        ? process.env.MONGO_URI_DEV
        : process.env.MONGO_URI_PRO;

    if (!mongoUri) {
      throw new Error("MongoDB connection string is missing from .env");
    }

    await mongoose.connect(mongoUri);

    console.log("✅ MongoDB connected locally");

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start:", error.message);
  }
};

startServer();