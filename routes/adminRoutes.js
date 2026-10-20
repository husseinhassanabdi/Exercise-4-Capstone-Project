import { Router } from "express";
import { adminOverview } from "../controllers/adminController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/overview", protect, adminOnly, adminOverview);

export default router;