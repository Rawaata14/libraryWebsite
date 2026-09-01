/*
=========================================================
useBookReservation.js

תיאור הקובץ:
Custom Hook המרכז את הלוגיקה של דף שריון הספר
והצטרפות לרשימת ההמתנה.

אחריות:
- טעינת הספר שנבחר.
- שחזור הספר לאחר רענון הדף.
- טעינת הזמנות המקום של המשתמש.
- סינון הזמנות תקפות.
- ניהול בחירת הזמנת מקום.
- שריון ספר זמין.
- הצטרפות לרשימת המתנה לספר שאינו זמין.
=========================================================
*/

import { useContext, useEffect, useMemo, useState } from "react";

import { useLocation, useParams } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";

import { getBookById, reserveBook } from "../services/bookService";

import { getReservations } from "../services/reservationService";

import { joinBookWaitingList } from "../services/waitingListService";

import { splitReservationsByTime } from "../utils/reservationUtils";

/*
---------------------------------------------------------
ELIGIBLE_RESERVATION_STATUSES

תפקיד:
מרכז את הסטטוסים שמאפשרים לשריין ספר או
להצטרף לרשימת המתנה לספר.

הספר מיועד לשימוש בתוך הספרייה ולכן נדרשת
הזמנת מקום תקפה גם לצורך ההמתנה.
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
getRequestErrorMessage

תפקיד:
מחזירה הודעת שגיאה ברורה מתוך שגיאת Axios.
---------------------------------------------------------
*/
function getRequestErrorMessage(error, fallbackMessage) {
  return error.response?.data?.message || error.message || fallbackMessage;
}

/*
---------------------------------------------------------
useBookReservation

תפקיד:
מספק לדף הספר את כל המידע והפעולות הנדרשות
לשריון או להצטרפות לרשימת המתנה.
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
  טעינת הספר והזמנות המקום

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
          ספרנית עשויה לקבל מהשרת את כל ההזמנות.
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

        /*
          רק הזמנה בעלת מצב פעיל יכולה לשמש
          לשריון ספר או להצטרפות לתור.
          */
        const reservationsWithValidStatus = currentUserReservations.filter(
          (reservation) =>
            ELIGIBLE_RESERVATION_STATUSES.includes(
              reservation.status?.toLowerCase(),
            ),
        );

        /*
          splitReservationsByTime משתמש בזמן
          הספרייה ומחזיר רק הזמנות עתידיות
          שעדיין לא הסתיימו.
          */
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
            getRequestErrorMessage(
              loadError,
              "Failed to load the book reservation details.",
            ),
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
  isBookAvailable

  תפקיד:
  קובעת אם קיים כרגע לפחות עותק זמין.

  הערך קובע איזו פעולה תתבצע:
  - true: שריון ספר.
  - false: הצטרפות לרשימת המתנה.
  ---------------------------------------------------------
  */
  const isBookAvailable = Number(book?.available_quantity) > 0;

  /*
  ---------------------------------------------------------
  selectedReservation

  תפקיד:
  מחזירה את אובייקט הזמנת המקום שנבחרה.
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
  מעדכנת את הזמנת המקום שנבחרה ומנקה
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
  מבצעת את הפעולה המתאימה לפי זמינות הספר.

  אם הספר זמין:
  - נשלחת בקשת שריון.
  - הכמות הזמינה מתעדכנת מקומית.

  אם הספר אינו זמין:
  - המשתמש מצטרף לרשימת ההמתנה.
  - ההמתנה מקושרת להזמנת המקום שנבחרה.
  - הכמות אינה משתנה.
  ---------------------------------------------------------
  */
  const handleReserveBook = async () => {
    if (!book?.bookId) {
      setError("No book was selected.");

      return;
    }

    if (!selectedReservationId) {
      setError(
        isBookAvailable
          ? "Select a valid seat reservation before reserving the book."
          : "Select a valid seat reservation before joining the waiting list.",
      );

      return;
    }

    try {
      setIsLoading(true);

      setError("");

      setSuccessMessage("");

      const reservationId = Number(selectedReservationId);

      /*
      -------------------------------------------------------
      שריון ספר זמין
      -------------------------------------------------------
      */
      if (isBookAvailable) {
        const response = await reserveBook(book.bookId, reservationId);

        setSuccessMessage(
          response.data?.message || "Book reserved successfully.",
        );

        /*
        עדכון מקומי של הכמות מונע הצגת מלאי
        ישן לאחר השלמת השריון.
        */
        setBook((currentBook) => ({
          ...currentBook,

          available_quantity: Math.max(
            Number(currentBook.available_quantity) - 1,
            0,
          ),
        }));

        return;
      }

      /*
      -------------------------------------------------------
      הצטרפות לרשימת ההמתנה

      השרת בודק:
      - שהספר קיים ואינו זמין.
      - שהזמנת המקום שייכת למשתמש.
      - שההזמנה עדיין תקפה.
      - שאין כבר המתנה פעילה זהה.
      -------------------------------------------------------
      */
      const result = await joinBookWaitingList(book.bookId, reservationId);

      setSuccessMessage(
        result.message || "You joined the book waiting list successfully.",
      );
    } catch (reservationError) {
      console.error(
        isBookAvailable
          ? "Error reserving book:"
          : "Error joining book waiting list:",
        reservationError,
      );

      setError(
        getRequestErrorMessage(
          reservationError,
          isBookAvailable
            ? "Failed to reserve the book. Please try again."
            : "Failed to join the waiting list. Please try again.",
        ),
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
    isBookAvailable,
    isPageLoading,
    isLoading,
    error,
    successMessage,
    handleReservationChange,
    handleReserveBook,
  };
}
