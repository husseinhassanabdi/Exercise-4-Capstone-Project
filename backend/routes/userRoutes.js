
import { Router } from "express";
import User from "../models/User.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

// GET all users (requires authentication)
router.get("/", protect, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

export default router;

