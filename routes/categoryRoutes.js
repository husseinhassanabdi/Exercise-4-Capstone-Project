import { Router } from "express";
import { getCategories } from "../controllers/categoryController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", protect, getCategories);

export default router;