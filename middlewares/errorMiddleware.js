export const notFound = (req, res, next) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: "Email already exists" });
  }

  if (err.name === "ValidationError" || err.name === "CastError") {
    return res.status(400).json({ message: "Invalid data supplied" });
  }

  res.status(err.status || 500).json({
    message: err.status ? err.message : "Internal server error",
  });
};