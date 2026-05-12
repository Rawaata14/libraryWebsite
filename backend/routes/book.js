const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const bookQueries = require("../database/queries/bookQueries");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// Route for adding a new book
router.post("/add-book", upload.single("image"), async (req, res) => {
  try {
    const bookDetails = req.body;
    bookDetails.image = req.file ? req.file.filename : null;
    const result = await bookQueries.addBook(bookDetails);
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in adding book:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
