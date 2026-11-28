/*
=========================================================
auth.js

תיאור הקובץ:
Middleware משותף לבדיקת התחברות והרשאות משתמשים.

הקובץ אחראי על:
- בדיקת קיום משתמש מחובר ב-Session.
- אימות סטטוס המשתמש מול מסד הנתונים.
- אימות התפקיד העדכני של המשתמש.
- הגבלת Routes מסוימים למשתמש מסוג librarian.
- החזרת תשובות שגיאה אחידות במקרה שאין הרשאה.
=========================================================
*/

const { doQuery } = require("../database/query");

/*
---------------------------------------------------------
requireAuth

תפקיד:
מאפשרת גישה למשתמש מחובר ופעיל בלבד.

פרמטרים:
- req: בקשת המשתמש.
- res: תגובת השרת.
- next: המשך שרשרת ה-Middleware.

ערך מוחזר:
- 401: המשתמש אינו מחובר או אינו קיים.
- 403: חשבון המשתמש אינו פעיל.
- 500: שגיאה בבדיקת המשתמש.
- next(): המשך הטיפול בבקשה.

לוגיקה:
- בודקת שקיים משתמש ב-Session.
- מאמתת את מזהה המשתמש.
- שולפת את הסטטוס והתפקיד ממסד הנתונים.
- מונעת גישה ממשתמש שאינו פעיל.
- מעדכנת את התפקיד והאימייל ב-Session.
---------------------------------------------------------
*/
async function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: "User is not authenticated",
    });
  }

  const userId = Number(req.session.user.userId);

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return res.status(401).json({
      success: false,
      message: "Invalid user session",
    });
  }

  try {
    const users = await doQuery(
      `SELECT userId, email, role, status
       FROM \`user\`
       WHERE userId = ?
       LIMIT 1`,
      [userId],
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active",
      });
    }

    // עדכון פרטי ההרשאה לפי המידע העדכני במסד הנתונים
    req.session.user.role = user.role;
    req.session.user.status = user.status;
    req.session.user.email = user.email;

    return next();
  } catch (error) {
    console.error("Error validating user session:", error);

    return res.status(500).json({
      success: false,
      message: "Could not validate user session",
    });
  }
}

/*
---------------------------------------------------------
requireLibrarian

תפקיד:
מאפשרת גישה למשתמש פעיל בעל תפקיד librarian בלבד.

פרמטרים:
- req: בקשת המשתמש.
- res: תגובת השרת.
- next: המשך שרשרת ה-Middleware.

ערך מוחזר:
- 401: המשתמש אינו מחובר או אינו קיים.
- 403: המשתמש אינו פעיל או אינו ספרן.
- 500: שגיאה בבדיקת המשתמש.
- next(): המשך הטיפול בבקשה.

לוגיקה:
- מפעילה את requireAuth לאימות המשתמש.
- בודקת את התפקיד העדכני שהתקבל ממסד הנתונים.
- מאפשרת המשך רק למשתמש מסוג librarian.
---------------------------------------------------------
*/
function requireLibrarian(req, res, next) {
  return requireAuth(req, res, () => {
    if (req.session.user.role !== "librarian") {
      return res.status(403).json({
        success: false,
        message: "Librarian privileges are required",
      });
    }

    return next();
  });
}

module.exports = {
  requireAuth,
  requireLibrarian,
};
