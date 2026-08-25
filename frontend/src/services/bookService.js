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
שולחת בקשה לשריון ספר במסגרת הזמנת
כיסא מסוימת השייכת למשתמש המחובר.
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
