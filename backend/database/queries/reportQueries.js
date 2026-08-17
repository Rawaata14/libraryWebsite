/*
=========================================================
reportQueries.js

תיאור הקובץ:
שאילתות דוחות עבור דף Reports של הספרן.

הקובץ כולל:
- ספירת משתמשים.
- ספירת משתמשים חסומים.
- ספירת ספרים.
- ספירת מקומות ישיבה.
- ספירת הזמנות פעילות.
- ספירת הודעות שלא נקראו.
=========================================================
*/

const doQuery = require("../query");

/*
---------------------------------------------------------
getReports

תפקיד:
שולפת נתוני סטטיסטיקה מרכזיים עבור דף הדוחות
של הספרן.
---------------------------------------------------------
*/
async function getReports() {
  try {
    const totalUsers = await doQuery("SELECT COUNT(*) AS count FROM `user`");

    const blockedUsers = await doQuery(
      "SELECT COUNT(*) AS count FROM `user` WHERE status = 'blocked'",
    );

    const totalBooks = await doQuery("SELECT COUNT(*) AS count FROM `book`");

    const totalSeats = await doQuery("SELECT COUNT(*) AS count FROM `seat`");

    const activeReservations = await doQuery(`
      SELECT COUNT(*) AS count
      FROM seat_reservation
      WHERE LOWER(status) IN (
        'pending',
        'active',
        'occupied',
        'confirmed'
      )
        AND TIMESTAMP(reservationDate, endTime) >= NOW()
    `);

    const unreadMessages = await doQuery(
      "SELECT COUNT(*) AS count FROM `messages` WHERE isRead = 0",
    );

    return {
      success: true,
      reports: {
        totalUsers: Number(totalUsers[0]?.count) || 0,
        blockedUsers: Number(blockedUsers[0]?.count) || 0,
        totalBooks: Number(totalBooks[0]?.count) || 0,
        totalSeats: Number(totalSeats[0]?.count) || 0,
        activeReservations: Number(activeReservations[0]?.count) || 0,
        unreadMessages: Number(unreadMessages[0]?.count) || 0,
      },
    };
  } catch (error) {
    console.error("Error loading reports:", error);

    return {
      success: false,
      message: "Failed to load reports",
    };
  }
}

module.exports = {
  getReports,
};
