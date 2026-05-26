const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const seatQueries = require("../database/queries/seatQueries");

// Route for saving the seat map
router.post("/save-map", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "librarian") {
      return res
        .status(403)
        .json({ message: "Access denied. Librarian privileges required." });
    }
    const seatsArray = req.body;
    const results = [];
    for (const seatDetails of seatsArray) {
      let result;
      if (!seatDetails.seatId) {
        result = await seatQueries.addSeat(seatDetails);
      } else {
        result = await seatQueries.updateSeat(seatDetails.seatId, seatDetails);
      }
      results.push(result);
    }
    if (results.every((r) => r.success)) {
      res.status(201).json({
        message: "Map saved successfully",
        data: results.map((r) => r.data),
      });
    } else {
      res.status(500).json({ message: "Failed to save some seats" });
    }
  } catch (error) {
    console.error("Error in saving seat map:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/get-map", async (req, res) => {
  try {
    const result = await seatQueries.getAllSeats();
    if (result.success) {
      res.status(200).json({ map: result.data });
    } else {
      res.status(500).json({ message: "Failed to fetch seat map" });
    }
  } catch (error) {
    console.error("Error in fetching seat map:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
