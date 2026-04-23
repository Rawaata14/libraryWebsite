const express = require("express");
const cors = require("cors");
const dbSingleton = require("./dbSingleton");

const app = express();
const db = dbSingleton.getConnection();

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.get("/users", (req, res) => {
  const sql = "SELECT user_id, full_name, email, phone, address FROM users";

  db.query(sql, (err, result) => {
    if (err) {
      console.error("SQL ERROR:", err);
      return res.status(500).json({
        message: "Failed to fetch users",
        error: err.message,
      });
    }

    res.status(200).json(result);
  });
});
console.log("Database connection established successfully.");
app.listen(8000, () => {
  console.log("Server running on http://localhost:8000");
});
