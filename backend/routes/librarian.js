/*
  librarian.js
  ------------
  קובץ Routes עבור דשבורד הספרן.

  הקובץ כולל:
  - שליפת עדכונים לספרן
  - הכנת נתונים להצגה בדף הפרופיל
*/

const express = require("express");
const router = express.Router();

/*
  getDashboardStats
  -----------------
  תפקיד:
  מחזיר עדכונים חשובים לספרן עבור דף הפרופיל.

  בהמשך:
  הנתונים יגיעו מהמסד לפי הזמנות, משתמשים, הודעות וספרים.
*/
router.get("/dashboard-stats", async (req, res) => {
  try {
    res.json({
      success: true,
      stats: {
        books: [
          {
            text: "3 בקשות השאלת ספרים ממתינות",
            link: "/manage-books",
          },
        ],
        seats: [
          {
            text: "2 הזמנות מקומות חדשות היום",
            link: "/manage-seats",
          },
        ],
        users: [
          {
            text: "2 משתמשים חדשים נרשמו",
            link: "/manage-users",
          },
        ],
        reports: [
          {
            text: "דוח פעילות שבועי מוכן",
            link: "/reports",
          },
        ],
        messages: [
          {
            text: "2 הודעות חדשות ממשתמשים",
            link: "/messages",
          },
        ],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load librarian dashboard stats",
    });
  }
});

module.exports = router;
