/*
=========================================================
bookService.js

תיאור הקובץ:
מרכז את בקשות ה-API הקשורות לניהול ספרים.

השירות אחראי בשלב זה על:
- הוספת ספר חדש עם תמונת כריכה.

ריכוז הבקשות מפריד בין תקשורת השרת
לבין טפסי ורכיבי React.
=========================================================
*/

import axios from "axios";

import { buildApiUrl } from "../config/api";

/*
---------------------------------------------------------
addBook

תפקיד:
שולחת לשרת נתוני ספר חדש באמצעות FormData,
כדי לאפשר גם העלאת תמונת כריכה.
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
שולחת לשרת בקשה לשריון או השאלת ספר ספציפי.
---------------------------------------------------------
*/
export const reserveBook = async (bookId) => {
  return axios.post(
    buildApiUrl(`/books/${bookId}/reserve`),
    {},
    {
      withCredentials: true,
    },
  );
};
