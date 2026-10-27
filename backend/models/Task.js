import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Done"],
      default: "Pending",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
