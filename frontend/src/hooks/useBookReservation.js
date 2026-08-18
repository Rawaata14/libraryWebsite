/*
=========================================================
useBookReservation.js

תיאור הקובץ:
Custom Hook המרכז את הלוגיקה העסקית, ניהול ה-State
והתקשורת מול השרת עבור עמוד שריון הספר (ReserveBookPage).
=========================================================
*/

import { useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {  reserveBook } from "../services/bookService";

export function useBookReservation() {
  const { state: book } = useLocation();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  /*
  ---------------------------------------------------------
  handleReserveBook

  תפקיד:
  שולחת לשרת בקשה לשריון ומטפלת בתגובה (הצלחה או שגיאה).
  ---------------------------------------------------------
  */
  const handleReserveBook = async (reservationData) => {
    try {
      setIsLoading(true);
      setError(null);

      // קריאה לשירות שיצרנו 
      await reserveBook(book.bookId);

      setSuccessMessage("הספר שוריין בהצלחה!");

      // ניתן להוסיף כאן ניווט לדשבורד או לעמוד ההזמנות לאחר הצלחה
      // setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      console.error("Error reserving book:", err);
      setError(
        err.response?.data?.message || "אירעה שגיאה בעת שריון הספר. נסי שוב.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    book,
    user,
    isLoading,
    error,
    successMessage,
    handleReserveBook,
  };
}
