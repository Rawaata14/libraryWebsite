/*
=========================================================
waitingListService.js

תיאור הקובץ:
מרכז את כל בקשות ה-API הקשורות לרשימות
ההמתנה של ספרים ושל מקומות ישיבה.

השירות אחראי על:
- הצטרפות לרשימת המתנה לספר.
- הצטרפות לרשימת המתנה למקום.
- שליפת רשימות ההמתנה של המשתמש המחובר.
- שליפת כל רשימות ההמתנה עבור הספרנית.
- ביטול השתתפות ברשימת המתנה.

השרת מזהה את המשתמש באמצעות ה-Session,
ולכן אין לשלוח userId מה-Frontend.
=========================================================
*/

import axios from "axios";

import { buildApiUrl } from "../config/api";

/*
---------------------------------------------------------
joinBookWaitingList

תפקיד:
מצרפת את המשתמש המחובר לרשימת ההמתנה
של ספר שאינו זמין כרגע.

פרמטרים:
- bookId:
  המזהה הפנימי של הספר.

- reservationId:
  מזהה הזמנת המקום שאליה המשתמש רוצה לקשר
  את הספר.

למה נדרשת הזמנת מקום:
בספרייה אין השאלת ספר לבית. הספר משוריין
לשימוש בתוך הספרייה במסגרת הזמנת מקום תקפה.
---------------------------------------------------------
*/
export async function joinBookWaitingList(bookId, reservationId) {
  const response = await axios.post(
    buildApiUrl("/waiting-lists/book"),
    {
      bookId,
      reservationId,
    },
    {
      withCredentials: true,
    },
  );

  return response.data;
}

/*
---------------------------------------------------------
joinSeatWaitingList

תפקיד:
מצרפת את המשתמש המחובר לרשימת ההמתנה
של מקום תפוס בתאריך ובטווח הזמן שנבחרו.

רשימת ההמתנה מוגדרת לפי:
- מספר המקום.
- תאריך.
- שעת התחלה.
- שעת סיום.

לכן המתנה לאותו מקום בשעות שונות נחשבת
לרשימת המתנה אחרת.
---------------------------------------------------------
*/
export async function joinSeatWaitingList({
  seatId,
  date,
  startTime,
  endTime,
}) {
  const response = await axios.post(
    buildApiUrl("/waiting-lists/seat"),
    {
      seatId,
      date,
      startTime,
      endTime,
    },
    {
      withCredentials: true,
    },
  );

  return response.data;
}

/*
---------------------------------------------------------
getMyWaitingLists

תפקיד:
שולפת את כל רשימות ההמתנה השייכות למשתמש
המחובר.

התוצאה כוללת:
- רשימות המתנה לספרים.
- רשימות המתנה למקומות.
- מיקום בתור.
- מצב ההמתנה.
- זמני הצעה ופקיעת הצעה, אם קיימים.
---------------------------------------------------------
*/
export async function getMyWaitingLists() {
  const response = await axios.get(buildApiUrl("/waiting-lists/mine"), {
    withCredentials: true,
  });

  return response.data;
}

/*
---------------------------------------------------------
getAllWaitingLists

תפקיד:
שולפת את כל רשימות ההמתנה במערכת.

גישה:
הנתיב מיועד לספרנית בלבד. בדיקת ההרשאה
מתבצעת גם ב-Backend.
---------------------------------------------------------
*/
export async function getAllWaitingLists() {
  const response = await axios.get(buildApiUrl("/waiting-lists/all"), {
    withCredentials: true,
  });

  return response.data;
}

/*
---------------------------------------------------------
cancelWaitingEntry

תפקיד:
מבטלת השתתפות של המשתמש המחובר ברשימת
המתנה מסוימת.

פרמטרים:
- type:
  סוג רשימת ההמתנה:
  "book" או "seat".

- waitingId:
  מזהה רשומת ההמתנה.

אבטחה:
גם אם משתמש ישנה את המזהה בדפדפן, השרת
יבטל רק רשומה השייכת למשתמש המחובר.
---------------------------------------------------------
*/
export async function cancelWaitingEntry(type, waitingId) {
  const response = await axios.delete(
    buildApiUrl(`/waiting-lists/${type}/${waitingId}`),
    {
      withCredentials: true,
    },
  );

  return response.data;
}
