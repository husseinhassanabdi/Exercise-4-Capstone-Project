import { Router } from "express";
import {
  createTask,
  deleteTask,
  getTask,
  getTasks,
  updateTask,
} from "../controllers/taskController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { taskSchema, taskUpdateSchema } from "../utils/validators.js";

const router = Router();

router.use(protect);
router.post("/", validate(taskSchema), createTask);
router.get("/", getTasks);
router.get("/:id", getTask);
router.patch("/:id", validate(taskUpdateSchema), updateTask);
router.put("/:id", validate(taskUpdateSchema), updateTask);
router.delete("/:id", deleteTask);

export default router;
