/*
=========================================================
dbSingleton.js

תיאור הקובץ:
ניהול חיבור מרכזי למסד הנתונים MySQL.

הקובץ אחראי על:
- טעינת הגדרות מסד הנתונים מקובץ .env.
- יצירת Connection Pool יחיד.
- בדיקת החיבור לפני השימוש הראשון.
- החזרת אותו Pool לכל שכבות ה-Queries.
=========================================================
*/


const mysql = require("mysql2/promise");

let connectionPool = null;

/*
---------------------------------------------------------
createConnectionPool

תפקיד:
יוצרת Connection Pool חדש עבור MySQL.

למה נוצרה:
Pool מאפשר לשרת לטפל בכמה שאילתות במקביל,
במקום להסתמך על חיבור יחיד שעלול להתנתק.
---------------------------------------------------------
*/
function createConnectionPool() {
  return mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "librarywebsite",

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

/*
---------------------------------------------------------
getConnection

תפקיד:
מחזירה את ה-Connection Pool המרכזי של המערכת.

בפעם הראשונה:
- יוצרת את ה-Pool.
- מריצה שאילתת בדיקה.

בפעמים הבאות:
- מחזירה את אותו Pool שכבר נוצר.
---------------------------------------------------------
*/
async function getConnection() {
  if (!connectionPool) {
    connectionPool = createConnectionPool();

    try {
      await connectionPool.query("SELECT 1");

      console.log("Connected to MySQL successfully.");
    } catch (error) {
      connectionPool = null;

      console.error("Failed to connect to MySQL:", error.message);

      throw error;
    }
  }

  return connectionPool;
}

module.exports = {
  getConnection,
};
