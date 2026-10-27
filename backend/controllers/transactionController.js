import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import { categories } from "../utils/categories.js";

export const createTransaction = async (req, res, next) => {
  try {
    const { title, amount, type, category, date } = req.body;

    if (!categories[type].includes(category)) {
      return res.status(400).json({ message: "Invalid category for transaction type" });
    }

    const transaction = await Transaction.create({
      title,
      amount,
      type,
      category,
      date,
      user: req.user._id,
    });

    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (req, res, next) => {
  try {
    const { type, category, startDate, endDate } = req.query;
    const filter = { user: req.user._id };

    if (type) {
      if (!["income", "expense"].includes(type)) {
        return res.status(400).json({ message: "Invalid transaction type" });
      }
      filter.type = type;
    }

    if (category) filter.category = category;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const start = new Date(startDate);
        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({ message: "Invalid startDate" });
        }
        filter.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({ message: "Invalid endDate" });
        }
        filter.date.$lte = end;
      }
    }

    const transactions = await Transaction.find(filter).sort({ date: -1 });
    res.json({ count: transactions.length, transactions });
  } catch (error) {
    next(error);
  }
};

export const monthlySummary = async (req, res, next) => {
  try {
    const year = Number(req.query.year);
    const month = Number(req.query.month);

    if (
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100 ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      return res.status(400).json({
        message: "Provide a valid year and month (1-12)",
      });
    }

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const summary = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user._id),
          date: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: { type: "$type", category: "$category" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.type": 1, total: -1 },
      },
    ]);

    const totals = summary.reduce(
      (result, item) => {
        result[item._id.type] += item.total;
        return result;
      },
      { income: 0, expense: 0 }
    );

    res.json({ year, month, totals, byCategory: summary });
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const allowed = ["title", "amount", "type", "category", "date"];
    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields supplied" });
    }

    const existing = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!existing) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const type = updates.type ?? existing.type;
    const category = updates.category ?? existing.category;

    if (!categories[type].includes(category)) {
      return res.status(400).json({ message: "Invalid category for transaction type" });
    }

    Object.assign(existing, updates);
    await existing.save();

    res.json(existing);
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    next(error);
  }
};