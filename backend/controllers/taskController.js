import mongoose from "mongoose";
import Task from "../models/Task.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createTask = async (req, res, next) => {
  try {
    const task = await Task.create({
      ...req.body,
      user: req.user._id,
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

export const getTasks = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filter = { user: req.user._id };

    if (status) {
      if (!["Pending", "In Progress", "Done"].includes(status)) {
        return res.status(400).json({ message: "Invalid task status" });
      }
      filter.status = status;
    }

    if (search !== undefined && typeof search !== "string") {
      return res.status(400).json({ message: "Invalid task search" });
    }

    if (search?.trim()) {
      const expression = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [
        { title: expression },
        { description: expression },
      ];
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json({ count: tasks.length, tasks });
  } catch (error) {
    next(error);
  }
};

export const getTask = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const updates = {};
    for (const key of ["title", "description", "dueDate", "status"]) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields supplied" });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    next(error);
  }
};
