/*
=========================================================
report.js

תיאור הקובץ:
Routes עבור דף הדוחות של הספרן.

הקובץ כולל:
- Route לשליפת נתוני סטטיסטיקה.
=========================================================
*/

const express = require("express");
const router = express.Router();
const reportQueries = require("../database/queries/reportQueries");

/*
---------------------------------------------------------
Route: GET /reports

תפקיד:
שליפת דוחות וסטטיסטיקות עבור הספרן.
---------------------------------------------------------
*/
router.get("/", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "librarian") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const result = await reportQueries.getReports();

    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("Error getting reports:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
