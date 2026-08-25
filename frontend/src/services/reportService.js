/*
=========================================================
reportService.js

תיאור הקובץ:
מרכז את כל בקשות ה-API הקשורות לדוחות הספרייה.

כך דפי React אינם צריכים לדעת מהי כתובת השרת,
והתקשורת עם ה-Backend נשארת במקום אחד.
=========================================================
*/

import { buildApiUrl } from "../config/api";

/*
---------------------------------------------------------
getReports

תפקיד:
שולפת מהשרת את נתוני הדוחות והסטטיסטיקות
המיועדים לספרן.

הבקשה כוללת credentials כדי לשלוח את ה-Session
של המשתמש המחובר.
---------------------------------------------------------
*/
export async function getReports() {
  const response = await fetch(buildApiUrl("/reports"), {
    method: "GET",
    credentials: "include",
  });

  /*
  גם כאשר השרת מחזיר שגיאת 401, 403 או 500,
  fetch אינו זורק שגיאה אוטומטית.
  לכן בודקים את response.ok באופן מפורש.
  */
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to load reports");
  }

  return data.reports;
}
