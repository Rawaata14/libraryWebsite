const express = require("express");
const session = require("express-session");
const cors = require("cors");
const dbSingleton = require("./database/dbSingleton");
const path = require("path");
const librarianRoutes = require("./routes/librarian");
const app = express();

app.use(
  cors({
    origin: "http://localhost:5000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.use(express.json());

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true if using HTTPS
      httpOnly: true,
      sameSite: "lax", // Adjust based on your needs (e.g., "strict" or "none")
    },
  }),
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const db = dbSingleton.getConnection();

const userRoutes = require("./routes/user");
app.use("/user", userRoutes);
app.use("/books", require("./routes/book"));
app.use("/seats", require("./routes/seat"));
app.use("/reservations", require("./routes/reservation"));

// חיבור הנתיבים של מערכת ההודעות לשרת
app.use("/messages", require("./routes/message"));

// חיבור הנתיבים של מערכת הדוחות לשרת
app.use("/reports", require("./routes/report"));

app.use("/api/librarian", librarianRoutes);
console.log("Database connection established successfully.");
app.listen(8000, () => {
  console.log("Server running on http://localhost:8000");
});

// חיבור נתיבי ההתראות של המשתמשים
app.use("/notifications",
  require("./routes/notification"),
);
