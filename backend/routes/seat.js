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

// Route for fetching the seat map by date and time slot
router.get("/get-map", async (req, res) => {
  try {
    // 1. מקבלים את התאריך והשעה מה-Frontend
    const { date, time } = req.query;

    let startTime = null;
    let endTime = null;

    // 2. השרת מפצל את המחרוזת של השעה ל-startTime ו-endTime
    if (time && time.includes(" - ")) {
      const parts = time.split(" - ");
      startTime = parts[0];
      endTime = parts[1];
    }

    // 3. קוראים לפונקציה החדשה ב-Queries עם הנתונים המעובדים
    const result = await seatQueries.getMapSeatsByTimeSlot(
      date,
      startTime,
      endTime,
    );

    if (result.success) {
      res.status(200).json({ map: result.map });
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

// Route for updating a seat's status (e.g. blocking/unblocking)
router.put("/status/:seatId", requireLibrarian, async (req, res) => {
  try {
    const seatId = req.params.seatId;
    const { status, location, rotation, x, y, type } = req.body;

    // שולפים את הכיסא הקיים כדי לא לאבד שדות אחרים אם הם לא נשלחו
    // לחלופין, אפשר להשתמש בפונקציה קיימת שמביאה את הכיסא לפי ID,
    // אבל אם את שולחת את כל אובייקט הכיסא ממה שקיים ב-State - אפשר לעדכן ישירות:
    const result = await seatQueries.updateSeat(seatId, req.body);

    if (result.success) {
      res
        .status(200)
        .json({ success: true, message: "Seat status updated successfully" });
    } else {
      res
        .status(500)
        .json({ success: false, message: "Failed to update seat status" });
    }
  } catch (error) {
    console.error("Error in updating seat status:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
