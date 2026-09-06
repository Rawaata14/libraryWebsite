/*
=========================================================
app.js

תיאור הקובץ:
נקודת הכניסה הראשית של שרת ה-Backend.

הקובץ אחראי על:
- טעינת משתני הסביבה.
- יצירת שרת Express.
- הגדרת CORS, JSON ו-Session.
- חיבור כל קובצי ה-Routes.
- הפעלת שירות התזכורות.
- הפעלת מתזמן רשימות ההמתנה.
- טיפול בנתיבים לא קיימים ובשגיאות.
- בדיקת החיבור למסד לפני הפעלת השרת.
=========================================================
*/

require("dotenv").config({ quiet: true });

const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");

const dbSingleton = require("./database/dbSingleton");

const userRoutes = require("./routes/user");
const bookRoutes = require("./routes/book");
const seatRoutes = require("./routes/seat");
const reservationRoutes = require("./routes/reservation");
const messageRoutes = require("./routes/message");
const reportRoutes = require("./routes/report");
const notificationRoutes = require("./routes/notification");
const librarianRoutes = require("./routes/librarian");

/*
---------------------------------------------------------
ייבוא הנתיבים של רשימות ההמתנה

תפקיד:
מחבר לשרת את הפעולות של רשימות ההמתנה
לספרים ולמקומות.
---------------------------------------------------------
*/
const waitingListRoutes = require("./routes/waitingList");

/*
---------------------------------------------------------
ייבוא מתזמן רשימות ההמתנה

תפקיד:
מאפשר להפעיל את תהליכי הרקע המטפלים
בהצעות זמינות וברשומות שפג תוקפן.
---------------------------------------------------------
*/
const {
  startWaitingListScheduler,
} = require("./services/waitingListScheduler");

const app = express();

const PORT = Number(process.env.PORT) || 8000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5000";
const SESSION_SECRET = process.env.SESSION_SECRET;

const {
  checkAndSendExpirationReminders,
} = require("./utils/reminderEmailService");

/*
---------------------------------------------------------
בדיקת SESSION_SECRET

תפקיד:
מונעת הפעלת שרת ללא Secret שמגן על ה-Session.
---------------------------------------------------------
*/
if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing. Add it to backend/.env");
}

/*
=========================================================
הגדרות כלליות ואבטחה בסיסית
=========================================================
*/

app.disable("x-powered-by");

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

/*
---------------------------------------------------------
CORS

תפקיד:
מאפשר ל-Frontend לשלוח בקשות ל-Backend
יחד עם עוגיית ה-Session.
---------------------------------------------------------
*/
app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
---------------------------------------------------------
Session

תפקיד:
שומר את זהות המשתמש המחובר בין בקשות שונות.
---------------------------------------------------------
*/
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 8,
    },
  }),
);

/*
---------------------------------------------------------
Static uploads

תפקיד:
מאפשר ל-Frontend לגשת לתמונות ספרים ותמונות פרופיל.
---------------------------------------------------------
*/
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/*
=========================================================
Routes
=========================================================
*/

app.use("/user", userRoutes);
app.use("/books", bookRoutes);
app.use("/seats", seatRoutes);
app.use("/reservations", reservationRoutes);
app.use("/messages", messageRoutes);
app.use("/reports", reportRoutes);
app.use("/notifications", notificationRoutes);

/*
---------------------------------------------------------
Waiting-list routes

תפקיד:
מאפשר למשתמשים ולספרנית לבצע פעולות
ברשימות ההמתנה לספרים ולמקומות.
---------------------------------------------------------
*/
app.use("/waiting-lists", waitingListRoutes);

app.use("/api/librarian", librarianRoutes);

/*
---------------------------------------------------------
GET /health

תפקיד:
מאפשר לבדוק במהירות שהשרת פועל.
---------------------------------------------------------
*/
app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

/*
---------------------------------------------------------
טיפול בנתיב לא קיים

תפקיד:
מחזיר תשובת 404 מסודרת לכל Route שאינו קיים.
---------------------------------------------------------
*/
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/*
---------------------------------------------------------
טיפול מרכזי בשגיאות

תפקיד:
מחזיר תשובה אחידה במקרה של שגיאה שלא טופלה
בתוך אחד מקובצי ה-Routes.
---------------------------------------------------------
*/
app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error.message);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

/*
---------------------------------------------------------
startServer

תפקיד:
בודקת את החיבור למסד הנתונים ורק לאחר הצלחה
מפעילה את שרת Express.

לאחר הפעלת השרת מופעל גם מתזמן
רשימות ההמתנה.

למה נוצרה:
אין טעם להפעיל שרת או מתזמן שאינם מסוגלים
לגשת למסד הנתונים.
---------------------------------------------------------
*/
async function startServer() {
  try {
    await dbSingleton.getConnection();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);

      /*
      מתזמן רשימות ההמתנה מופעל רק לאחר
      שהחיבור למסד והפעלת השרת הצליחו.
      */
      startWaitingListScheduler();
    });
  } catch (error) {
    console.error(
      "Server could not start because the database connection failed.",
    );

    process.exit(1);
  }
}

/*
---------------------------------------------------------
טיפול מרכזי בשגיאות

תפקיד:
מחזיר תשובה אחידה במקרה של שגיאה שלא טופלה
בתוך אחד מקובצי ה-Routes.
---------------------------------------------------------
*/
app.use((error, req, res, next) => {
  console.error("=== שגיאה מפורטת בשרת: ===");
  console.error(error.stack); // <--- מוסיפים את זה כדי לראות את המיקום המדויק

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

/*
---------------------------------------------------------
הפעלת שירות התזכורות

תפקיד:
בודק בכל דקה אם קיימת הזמנה שעומדת
להסתיים ושולח למשתמש את התזכורת המתאימה.

החלק נשמר בהתאם למימוש של השותפה.
---------------------------------------------------------
*/
setInterval(() => {
  checkAndSendExpirationReminders();
}, 60000);

startServer();

module.exports = app;
