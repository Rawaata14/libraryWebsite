/*
=========================================================
auth.js

תיאור הקובץ:
Middleware משותף לבדיקת התחברות והרשאות משתמשים.

הקובץ אחראי על:
- בדיקה שקיים משתמש מחובר ב-Session.
- הגבלת Routes מסוימים למשתמש מסוג librarian.
- החזרת תשובות שגיאה אחידות במקרה שאין הרשאה.
=========================================================
*/

/*
---------------------------------------------------------
requireAuth

תפקיד:
מאפשרת להמשיך ל-Route רק אם קיים משתמש מחובר
בתוך ה-Session.

אם המשתמש אינו מחובר:
מחזירה תשובת 401 ולא מפעילה את ה-Route הבא.
---------------------------------------------------------
*/
function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: "User is not authenticated",
    });
  }

  return next();
}

/*
---------------------------------------------------------
requireLibrarian

תפקיד:
מאפשרת גישה רק למשתמש מחובר בעל תפקיד librarian.

אם המשתמש אינו מחובר:
מחזירה 401.

אם המשתמש מחובר אך אינו ספרן:
מחזירה 403.
---------------------------------------------------------
*/
function requireLibrarian(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: "User is not authenticated",
    });
  }

  if (req.session.user.role !== "librarian") {
    return res.status(403).json({
      success: false,
      message: "Librarian privileges are required",
    });
  }

  return next();
}

module.exports = {
  requireAuth,
  requireLibrarian,
};
