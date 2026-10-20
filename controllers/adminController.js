import mongoose from "mongoose";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

export const adminOverview = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();

    const [spendingCategories, totals] = await Promise.all([
      Transaction.aggregate([
        { $match: { type: "expense" } },
        {
          $group: {
            _id: "$category",
            totalSpent: { $sum: "$amount" },
            transactions: { $sum: 1 },
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 5 },
      ]),
      Transaction.aggregate([
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    res.json({
      totalUsers,
      spendingCategories,
      totals: Object.fromEntries(totals.map((item) => [item._id, item.total])),
    });
  } catch (error) {
    next(error);
  }
};