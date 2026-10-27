import { Router } from "express";
import {
  createTransaction,
  getTransactions,
  monthlySummary,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transactionController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
  transactionSchema,
  transactionUpdateSchema,
} from "../utils/validators.js";

const router = Router();


/**
 * @swagger
 * tags:
 *   - name: Transactions
 *     description: Manage personal income and expenses
 */

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Get all transactions for the logged-in user
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Create an income or expense transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - amount
 *               - type
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       400:
 *         description: Invalid transaction data
 */

/**
 * @swagger
 * /transactions/summary/monthly:
 *   get:
 *     summary: Get a monthly income and expense summary
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly summary retrieved successfully
 */

/**
 * @swagger
 * /transactions/{id}:
 *   patch:
 *     summary: Update a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *       404:
 *         description: Transaction not found
 */

/**
 * @swagger
 * /transactions/{id}:
 *   delete:
 *     summary: Delete a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 *       404:
 *         description: Transaction not found
 */


router.use(protect);
router.get("/summary/monthly", monthlySummary);
// router.get("/monthly-summary", monthlySummary);
router.patch("/:id", validate(transactionUpdateSchema), updateTransaction);
router.post("/", validate(transactionSchema), createTransaction);
router.get("/", getTransactions);
router.put("/:id", validate(transactionUpdateSchema), updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;