/*
=========================================================
useBookReservation.js

תיאור הקובץ:
Custom Hook המרכז את הלוגיקה של דף שריון הספר.

אחריות:
- טעינת הספר שנבחר.
- שחזור הספר לאחר רענון הדף.
- טעינת הזמנות הכיסא של המשתמש.
- סינון הזמנות תקפות.
- ניהול בחירת הזמנת כיסא.
- שליחת בקשת שריון הספר.
=========================================================
*/

import { useContext, useEffect, useMemo, useState } from "react";

import { useLocation, useParams } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";

import { getBookById, reserveBook } from "../services/bookService";

import { getReservations } from "../services/reservationService";

import { splitReservationsByTime } from "../utils/reservationUtils";

/*
---------------------------------------------------------
ELIGIBLE_RESERVATION_STATUSES

תפקיד:
מרכז את הסטטוסים שמאפשרים לשריין ספר.
---------------------------------------------------------
*/
const ELIGIBLE_RESERVATION_STATUSES = [
  "pending",
  "active",
  "occupied",
  "confirmed",
];

/*
---------------------------------------------------------
useBookReservation

תפקיד:
מספק לדף השריון את כל המידע והפעולות הנדרשות.
---------------------------------------------------------
*/
export function useBookReservation() {
  const location = useLocation();
  const { id: routeBookId } = useParams();

  const { user } = useContext(AuthContext);

  const [book, setBook] = useState(location.state || null);

  const [eligibleReservations, setEligibleReservations] = useState([]);

  const [selectedReservationId, setSelectedReservationId] = useState("");

  const [isPageLoading, setIsPageLoading] = useState(true);

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  /*
  ---------------------------------------------------------
  טעינת הספר והזמנות הכיסא

  אם פרטי הספר לא הגיעו דרך הניווט:
  הספר נשלף מחדש לפי המזהה שבכתובת.
  ---------------------------------------------------------
  */
  useEffect(() => {
    let isMounted = true;

    const loadReservationPageData = async () => {
      try {
        setIsPageLoading(true);
        setError("");

        const bookRequest = location.state
          ? Promise.resolve(location.state)
          : getBookById(routeBookId);

        const [loadedBook, reservationsResponse] = await Promise.all([
          bookRequest,
          getReservations(),
        ]);

        if (!isMounted) {
          return;
        }

        const reservations = reservationsResponse.data?.reservations || [];

        /*
        ספרן עשוי לקבל מהשרת את כל ההזמנות.
        לכן מתבצע גם סינון בצד התצוגה לפי userId.

        ה-Backend עדיין מבצע בדיקת בעלות נוספת,
        ולכן אין הסתמכות אבטחתית על הסינון הזה.
        */
        const currentUserReservations = reservations.filter((reservation) => {
          if (!reservation.userId || !user?.userId) {
            return true;
          }

          return Number(reservation.userId) === Number(user.userId);
        });

        const reservationsWithValidStatus = currentUserReservations.filter(
          (reservation) =>
            ELIGIBLE_RESERVATION_STATUSES.includes(
              reservation.status?.toLowerCase(),
            ),
        );

        const { upcomingReservations } = splitReservationsByTime(
          reservationsWithValidStatus,
        );

        setBook(loadedBook);

        setEligibleReservations(upcomingReservations);

        setSelectedReservationId(
          upcomingReservations.length > 0
            ? String(upcomingReservations[0].reservationId)
            : "",
        );
      } catch (loadError) {
        console.error("Error loading book reservation page:", loadError);

        if (isMounted) {
          setError(
            loadError.response?.data?.message ||
              "Failed to load the book reservation details.",
          );
        }
      } finally {
        if (isMounted) {
          setIsPageLoading(false);
        }
      }
    };

    loadReservationPageData();

    return () => {
      isMounted = false;
    };
  }, [location.state, routeBookId, user?.userId]);

  /*
  ---------------------------------------------------------
  selectedReservation

  תפקיד:
  מחזירה את אובייקט ההזמנה שנבחרה לפי המזהה.
  ---------------------------------------------------------
  */
  const selectedReservation = useMemo(
    () =>
      eligibleReservations.find(
        (reservation) =>
          String(reservation.reservationId) === String(selectedReservationId),
      ) || null,
    [eligibleReservations, selectedReservationId],
  );

  /*
  ---------------------------------------------------------
  handleReservationChange

  תפקיד:
  מעדכנת את הזמנת הכיסא שנבחרה ומנקה
  הודעות קודמות.
  ---------------------------------------------------------
  */
  const handleReservationChange = (reservationId) => {
    setSelectedReservationId(reservationId);
    setError("");
    setSuccessMessage("");
  };

  /*
  ---------------------------------------------------------
  handleReserveBook

  תפקיד:
  שולחת לשרת את הספר ואת הזמנת הכיסא שנבחרה.
  ---------------------------------------------------------
  */
  const handleReserveBook = async () => {
    if (!book?.bookId) {
      setError("No book was selected.");
      return;
    }

    if (!selectedReservationId) {
      setError("Select a valid seat reservation before reserving the book.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSuccessMessage("");

      const response = await reserveBook(
        book.bookId,
        Number(selectedReservationId),
      );

      setSuccessMessage(
        response.data?.message || "Book reserved successfully.",
      );

      /*
      עדכון מקומי של מספר העותקים מונע הצגת
      מלאי ישן לאחר השלמת השריון.
      */
      setBook((currentBook) => ({
        ...currentBook,
        available_quantity: Math.max(
          Number(currentBook.available_quantity) - 1,
          0,
        ),
      }));
    } catch (reservationError) {
      console.error("Error reserving book:", reservationError);

      setError(
        reservationError.response?.data?.message ||
          "Failed to reserve the book. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    book,
    user,
    eligibleReservations,
    selectedReservation,
    selectedReservationId,
    isPageLoading,
    isLoading,
    error,
    successMessage,
    handleReservationChange,
    handleReserveBook,
  };
}
