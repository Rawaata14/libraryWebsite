/*
=========================================================
query.js

תיאור הקובץ:
פונקציה מרכזית להרצת שאילתות MySQL.

הקובץ אחראי על:
- קבלת שאילתת SQL והפרמטרים שלה.
- קבלת ה-Connection Pool.
- הרצת השאילתה בצורה בטוחה.
- החזרת התוצאה לשכבת ה-Queries.
- העברת שגיאות לשכבה שקראה לפונקציה.
=========================================================
*/

const { getConnection } = require("./dbSingleton");

/*
---------------------------------------------------------
doQuery

תפקיד:
מריצה שאילתת SQL באמצעות ה-Connection Pool.

פרמטרים:
- sql: פקודת ה-SQL שרוצים להריץ.
- params: הערכים שמחליפים את סימני השאלה בשאילתה.

למה נוצרה:
מרכזת את הגישה למסד הנתונים ומונעת חזרה
על קוד החיבור בכל קובץ Queries.
---------------------------------------------------------
*/
async function doQuery(sql, params = []) {
  try {
    const database = await getConnection();

    const [result] = await database.query(sql, params);

    return result;
  } catch (error) {
    console.error("Database query failed:", {
      code: error.code,
      message: error.message,
    });

    throw error;
  }
}

module.exports = doQuery;
