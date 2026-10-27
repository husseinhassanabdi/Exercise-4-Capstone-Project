import { v2 as cloudinary } from "cloudinary";
import User from "../models/User.js";

export const uploadProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Profile picture is required" });
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "personal-finance-profiles",
          resource_type: "image",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: uploadResult.secure_url },
      { new: true }
    ).select("-password");

    res.json({
      message: "Profile picture uploaded successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};