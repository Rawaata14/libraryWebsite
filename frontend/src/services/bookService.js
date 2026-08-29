/*
=========================================================
bookService.js

תיאור הקובץ:
מרכז את בקשות ה-API הקשורות לספרים.

השירות אחראי על:
- שליפת כל הספרים.
- שליפת ספר לפי מזהה.
- הוספת ספר.
- שריון ספר במסגרת הזמנת כיסא.
- עריכת פרטי ספר וכמות עותקים.
- מחיקת ספר.
=========================================================
*/

import axios from "axios";

import { buildApiUrl } from "../config/api";

/*
---------------------------------------------------------
getAllBooks

תפקיד:
שולפת את כל הספרים במאגר.
---------------------------------------------------------
*/
export const getAllBooks = async () => {
  const response = await axios.get(buildApiUrl("/books/all-books"), {
    withCredentials: true,
  });

  return response.data;
};

/*
---------------------------------------------------------
getBookById

תפקיד:
שולפת ספר לפי bookId.

הפונקציה מאפשרת לשחזר את פרטי הספר גם לאחר
רענון ישיר של דף השריון.
---------------------------------------------------------
*/
export const getBookById = async (bookId) => {
  const response = await axios.get(buildApiUrl(`/books/${bookId}`), {
    withCredentials: true,
  });

  return response.data;
};

/*
---------------------------------------------------------
addBook

תפקיד:
שולחת לשרת ספר חדש יחד עם תמונת כריכה.
---------------------------------------------------------
*/
export const addBook = async (bookFormData) => {
  return axios.post(buildApiUrl("/books/add-book"), bookFormData, {
    withCredentials: true,
  });
};

/*
---------------------------------------------------------
reserveBook

תפקיד:
שולחת בקשה לשריון ספר במסגרת הזמנת כיסא
מסוימת השייכת למשתמש המחובר.
---------------------------------------------------------
*/
export const reserveBook = async (bookId, reservationId) => {
  return axios.post(
    buildApiUrl(`/books/${bookId}/reserve`),
    {
      reservationId,
    },
    {
      withCredentials: true,
    },
  );
};

/*
---------------------------------------------------------
updateBook

תפקיד:
שולחת לשרת את פרטי הספר והכמות הכוללת
המעודכנים.

הכמות הזמינה אינה נשלחת לעריכה ישירה.
השרת מחשב אותה בהתאם לכמות הכוללת ולמספר
העותקים שאינם זמינים.
---------------------------------------------------------
*/
export async function updateBook(bookId, bookDetails) {
  const response = await axios.patch(
    buildApiUrl(`/books/${bookId}`),
    bookDetails,
    {
      withCredentials: true,
    },
  );

  return response.data;
}

/*
---------------------------------------------------------
deleteBook

תפקיד:
שולחת לשרת בקשה למחיקת ספר לפי bookId.

השרת מאפשר את הפעולה רק לספרנית ורק אם אין
לספר היסטוריית השאלות.
---------------------------------------------------------
*/
export async function deleteBook(bookId) {
  const response = await axios.delete(buildApiUrl(`/books/${bookId}`), {
    withCredentials: true,
  });

  return response.data;
}
