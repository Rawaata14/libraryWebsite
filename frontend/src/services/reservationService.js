/*
=========================================================
reservationService.js

תיאור הקובץ:
מרכז את בקשות ה-API הקשורות לניהול הזמנות.

השירות אחראי על:
- שליפת כל ההזמנות עבור הספרן.
- ביטול הזמנה על ידי הספרן.
- שליחת הודעה לבעל ההזמנה.
- ביטול הזמנה על ידי המשתמש.

ריכוז הבקשות מונע כתובות API כפולות בתוך רכיבי React
ומפריד בין תקשורת השרת לבין לוגיקת התצוגה.
=========================================================
*/

import axios from "axios";

import { buildApiUrl } from "../config/api";

/*
---------------------------------------------------------
getReservations

תפקיד:
שולפת מהשרת את רשימת ההזמנות שהמשתמש המחובר
מורשה לראות בהתאם ל-session ולתפקיד שלו.
---------------------------------------------------------
*/
export const getReservations = async () => {
  return axios.get(buildApiUrl("/reservations/get-reservations"), {
    withCredentials: true,
  });
};

/*
---------------------------------------------------------
cancelReservationByLibrarian

תפקיד:
שולחת לשרת בקשה לביטול הזמנה על ידי ספרן,
יחד עם סיבת הביטול.
---------------------------------------------------------
*/
export const cancelReservationByLibrarian = async (reservationId, reason) => {
  return axios.patch(
    buildApiUrl(`/reservations/${reservationId}/librarian-cancel`),
    {
      reason,
    },
    {
      withCredentials: true,
    },
  );
};

/*
---------------------------------------------------------
sendReservationMessage

תפקיד:
שולחת הודעה לבעל ההזמנה לפי מזהה ההזמנה.
ה-Backend מאתר בעצמו את המשתמש המתאים.
---------------------------------------------------------
*/
export const sendReservationMessage = async (
  reservationId,
  subject,
  message,
) => {
  return axios.post(
    buildApiUrl(`/reservations/${reservationId}/message`),
    {
      subject,
      message,
    },
    {
      withCredentials: true,
    },
  );
};

/*
---------------------------------------------------------
cancelReservationByUser

תפקיד:
שולחת בקשה לביטול הזמנה השייכת למשתמש המחובר.

ה-Backend בודק דרך ה-session שההזמנה אכן
שייכת למשתמש המבצע את הפעולה.
---------------------------------------------------------
*/
export const cancelReservationByUser = async (reservationId) => {
  return axios.patch(
    buildApiUrl(`/reservations/${reservationId}/cancel`),
    {},
    {
      withCredentials: true,
    },
  );
};
