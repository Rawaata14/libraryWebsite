const express = require("express");

const seatQueries = require("../database/queries/seatQueries");
const { requireLibrarian } = require("../middleware/auth");

const router = express.Router();

// Route for saving the seat map
router.post("/save-map", requireLibrarian, async (req, res) => {
  try {
    console.log("Received seat map data:", req.body);

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

// Route for fetching the seat map
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

// Route for deleting a seat
router.delete("/delete-seat/:seatId", requireLibrarian, async (req, res) => {
  try {
    const seatId = req.params.seatId;
    const result = await seatQueries.deleteSeat(seatId);
    if (result.success) {
      res.status(200).json({ message: "Seat deleted successfully" });
    } else {
      res.status(500).json({ message: "Failed to delete seat" });
    }
  } catch (error) {
    console.error("Error in deleting seat:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
