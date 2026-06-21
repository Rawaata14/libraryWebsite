/*
=========================================================
reportQueries.js

תיאור הקובץ:
שאילתות דוחות עבור דף Reports של הספרן.

הקובץ כולל:
- ספירת משתמשים.
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
שליפת נתוני סטטיסטיקה מרכזיים עבור הספרן.
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

    const activeReservations = await doQuery(
      "SELECT COUNT(*) AS count FROM `reservation` WHERE status = 'active'",
    );

    const unreadMessages = await doQuery(
      "SELECT COUNT(*) AS count FROM `messages` WHERE isRead = FALSE",
    );

    return {
      success: true,
      reports: {
        totalUsers: totalUsers[0].count,
        blockedUsers: blockedUsers[0].count,
        totalBooks: totalBooks[0].count,
        totalSeats: totalSeats[0].count,
        activeReservations: activeReservations[0].count,
        unreadMessages: unreadMessages[0].count,
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
