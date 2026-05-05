// dbSingleton.js
const mysql = require("mysql2/promise"); 

let connection;

const dbSingleton = {
  getConnection: async () => {
    if (!connection) {
      try {
        connection = await mysql.createConnection({
          host: "localhost",
          user: "root",
          password: "",
          database: "librarywebsite",
        });

        console.log("Connected to MySQL successfully (Promise-based)!");

        // טיפול בניתוקים
        connection.on("error", (err) => {
          console.error("Database error:", err);
          if (err.code === "PROTOCOL_CONNECTION_LOST") {
            connection = null;
          }
        });
      } catch (err) {
        console.error("Error connecting to database:", err);
        connection = null;
        throw err; // זריקת השגיאה כדי שהשרת ידע שהחיבור נכשל
      }
    }

    return connection;
  },
};

module.exports = dbSingleton;
