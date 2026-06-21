const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const seatQueries = require("../database/queries/seatQueries");
const reservationQueries = require("../database/queries/reservationQueries");

//Route for saving reservation details
router.post("/reserve-seat", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { seatId, date, startTime, endTime } = req.body;
    const result = await reservationQueries.reserveSeat({
      userId: req.session.user.userId,
      seatId,
      reservationDate: date,
      startTime,
      endTime,
      status: "occupied",
    });

    if (result.success) {
      res.status(200).json({ message: "Seat occupied successfully" });
    } else {
      res.status(500).json({ message: "Failed to occupy seat" });
    }
  } catch (error) {
    console.error("Error in reserving seat:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/get-reservations", async (req, res) => {
    try {
        if(!req.session.user)
        {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const result = await reservationQueries.getAllReservations();
        if (result.success) {
            res.status(200).json({ reservations: result.data });
        } else {
            res.status(500).json({ message: "Failed to fetch reservations" });
        }
    } catch (error) {
        console.error("Error in fetching reservations:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;