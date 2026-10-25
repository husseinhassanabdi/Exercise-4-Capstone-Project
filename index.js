
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 6001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
  })
);

// Swagger
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/auth", authRoutes);
app.use("/transactions", transactionRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Personal Finance Tracker API is running",
  });
});

// Start only after MongoDB connects

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
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start:", error.message);
  }
};

startServer();

// const startServer = async () => {
//   try {
//     if (process.env.NODE_ENV === "development" ? process.env.MONGO_URI_DEV : process.env.MONGO_URI_PRO) {
//       throw new Error("MONGO_URI_DEV or MONGO_URI_PRO is missing from .env")
//     }

//     await mongoose.connect(process.env.MONGO_URI_DEV || process.env.MONGO_URI_PRO );
//     console.log("MongoDB connected successfully");

//     app.listen(PORT, () => {
//       console.log(`Server running on port ${PORT}`);
//     });
//   } catch (error) {
//     console.error("Failed to start:", error.message);
//     process.exit(1);
//   }
// };

// startServer();



app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
  })
);




