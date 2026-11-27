/*
=========================================================
useBookReservation.js

תיאור הקובץ:
Custom Hook המרכז את הלוגיקה של דף שריון הספר
והצטרפות לרשימת ההמתנה.

אחריות:
- זיהוי האם הזמנת הכיסא שנבחרה חסומה לשריון נוסף.
- מניעת שריון או הצטרפות לרשימת המתנה בחלון זמן שכבר שוריין.
- ניהול רשימת הזמנות כיסאות החסומות לשריון כפול.
- עדכון רשימת החסימות בהתאם לתשובת השרת.
- איפוס החסימות בעת החלפת ספר או משתמש.
- טעינת הספר שנבחר.
- שחזור הספר לאחר רענון הדף.
- טעינת הזמנות המקום של המשתמש.
- סינון הזמנות תקפות.
- ניהול בחירת הזמנת מקום.
- חישוב זמינות ספר בהתאם לתאריך ולשעות ההזמנה שנבחרה.
- עדכון זמינות בעת החלפת הזמנת מקום.
- ניהול מצב טעינה ושגיאות בבדיקת זמינות.
- מניעת שימוש בתוצאות בדיקת זמינות ישנות.
- מניעת שריון לפני השלמת בדיקת הזמינות.
- שריון ספר זמין.
- רענון זמינות העותקים ורשימת החסימות לאחר שריון מוצלח.
- הצטרפות לרשימת המתנה לספר שאינו זמין.
=========================================================
*/

import { useContext, useEffect, useMemo, useState } from "react";

import { useLocation, useParams } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";

import {
  getBookById,
  reserveBook,
  getBookAvailabilityByReservation,
} from "../services/bookService";

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
  const [availability, setAvailability] = useState(null);
  /*
מונה המפעיל בדיקת זמינות חוזרת מול השרת
לאחר שריון מוצלח, גם כאשר הזמנת הכיסא
שנבחרה לא השתנתה.
*/
  const [availabilityRefreshKey, setAvailabilityRefreshKey] = useState(0);
  /*
---------------------------------------------------------
ניהול רשימת הזמנות הכיסאות החסומות

הרשימה מכילה מזהי הזמנות כיסאות שבהן המשתמש
כבר שריין את אותו הספר בחלון זמן חופף.

הרשימה נשמרת בנפרד מנתוני זמינות המלאי,
כדי שלא תתאפס בעת מעבר בין הזמנות כיסאות.
---------------------------------------------------------
*/
  const [blockedReservationIds, setBlockedReservationIds] = useState([]);

  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(false);

  const [availabilityError, setAvailabilityError] = useState("");

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  /*
שמירת סוג הפעולה שהסתיימה בהצלחה:
reservation - שריון ספר.
waitingList - הצטרפות לרשימת המתנה.
null - טרם הושלמה פעולה.
*/
  const [completedAction, setCompletedAction] = useState(null);

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
בדיקת זמינות דינמית של הספר

תפקיד:
מחשבת מחדש את כמות העותקים הזמינים בכל פעם
שנבחרת הזמנת כיסא אחרת או נטען ספר אחר.

הבדיקה מתבצעת מול השרת בהתאם לתאריך ולשעות
של הזמנת הכיסא שנבחרה.

מנגנון isCurrentRequest מונע מתגובה ישנה
לעדכן את הזמינות לאחר שהמשתמש החליף הזמנה.
---------------------------------------------------------
*/
  const bookId = book?.bookId;

  /*
---------------------------------------------------------
איפוס רשימת ההזמנות החסומות

בעת החלפת ספר או משתמש, הרשימה מתאפסת
כדי למנוע שימוש בחסימות השייכות לספר
או למשתמש אחר.

הרשימה אינה מתאפסת בעת החלפת כיסא,
שעה או תאריך עבור אותו ספר ואותו משתמש.
---------------------------------------------------------
*/
  useEffect(() => {
    setBlockedReservationIds([]);
  }, [bookId, user?.userId]);

  useEffect(() => {
    let isCurrentRequest = true;

    setAvailability(null);
    setAvailabilityError("");

    if (!bookId || !selectedReservationId || !user?.userId) {
      setIsAvailabilityLoading(false);
      return;
    }

    /*
  -------------------------------------------------------
  checkBookAvailability

  תפקיד:
  שולחת בקשה לשרת לקבלת זמינות הספר בהתאם
  להזמנת הכיסא שנבחרה.

  במקרה של שגיאה נשמרת הודעה מתאימה,
  ולא מתאפשר ביצוע שריון על סמך מידע ישן.
  -------------------------------------------------------
  */
    const checkBookAvailability = async () => {
      try {
        setIsAvailabilityLoading(true);

        const result = await getBookAvailabilityByReservation(
          bookId,
          Number(selectedReservationId),
        );

        if (!isCurrentRequest) {
          return;
        }

        if (!result.success || !result.data) {
          throw new Error(
            result.message || "Failed to check book availability.",
          );
        }

        setAvailability({
          ...result.data,
          userId: user.userId,
        });
        /*
שמירת מזהי הזמנות הכיסאות החסומות שהתקבלו מהשרת.
הרשימה כוללת את כל ההזמנות החופפות לשריונים
קיימים של אותו הספר עבור המשתמש הנוכחי.
*/
        setBlockedReservationIds(
          (result.data.blockedReservationIds || []).map(Number),
        );
      } catch (availabilityRequestError) {
        if (isCurrentRequest) {
          setAvailabilityError(
            getRequestErrorMessage(
              availabilityRequestError,
              "Failed to check book availability.",
            ),
          );
        }
      } finally {
        if (isCurrentRequest) {
          setIsAvailabilityLoading(false);
        }
      }
    };

    checkBookAvailability();

    return () => {
      isCurrentRequest = false;
    };
  }, [bookId, selectedReservationId, user?.userId, availabilityRefreshKey]);

  /*
---------------------------------------------------------
isAvailabilityReady

תפקיד:
מוודא שנתוני הזמינות שהתקבלו מהשרת שייכים
לספר, למשתמש ולהזמנת הכיסא שנבחרו כרגע.
---------------------------------------------------------
*/
  const isAvailabilityReady =
    !isAvailabilityLoading &&
    availability !== null &&
    String(availability.bookId) === String(bookId) &&
    String(availability.seatReservationId) === String(selectedReservationId) &&
    String(availability.userId) === String(user?.userId);

  /*
---------------------------------------------------------
availableQuantity

תפקיד:
מייצג את כמות העותקים הזמינים בחלון הזמן
שנבחר. ערך null מציין שהזמינות טרם אומתה.
---------------------------------------------------------
*/
  const availableQuantity = isAvailabilityReady
    ? Number(availability.available_quantity)
    : null;

  /*
---------------------------------------------------------
isBookAvailable

תפקיד:
קובע האם קיים לפחות עותק אחד זמין
בהתאם להזמנת הכיסא שנבחרה.
---------------------------------------------------------
*/
  const isBookAvailable = isAvailabilityReady && availableQuantity > 0;

  /*
---------------------------------------------------------
isSelectedReservationBlocked

תפקיד:
מציין האם הזמנת הכיסא שנבחרה חסומה לשריון
נוסף של אותו הספר עקב חפיפת זמנים.

הבדיקה מתבצעת באמצעות רשימת מזהי ההזמנות
החסומות שהתקבלה מהשרת.
---------------------------------------------------------
*/
  const isSelectedReservationBlocked =
    Boolean(selectedReservationId) &&
    blockedReservationIds.includes(Number(selectedReservationId));

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
מעדכנת את הזמנת הכיסא שנבחרה ומנקה
את נתוני הזמינות וההודעות הקודמות.

פרמטרים:
- reservationId: מזהה הזמנת הכיסא שנבחרה.

לוגיקה:
- מונעת החלפת הזמנה בזמן ביצוע שריון.
- מונעת בדיקה חוזרת אם נבחרה אותה הזמנה.
- מאפסת את נתוני הזמינות הקודמים.
- שינוי מזהה ההזמנה מפעיל בדיקת זמינות
  חדשה באמצעות useEffect.
---------------------------------------------------------
*/
  const handleReservationChange = (reservationId) => {
    if (isLoading || reservationId === selectedReservationId) {
      return;
    }

    setAvailability(null);
    setAvailabilityError("");
    setSelectedReservationId(reservationId);
    setError("");
    setSuccessMessage("");
    setCompletedAction(null);
  };

  /*
  ---------------------------------------------------------
  handleReserveBook

  תפקיד:
  מבצעת את הפעולה המתאימה לפי זמינות הספר.

  אם הספר זמין:
  - נשלחת בקשת שריון.
  - נתוני הזמינות ורשימת החסימות מתעדכנים מחדש מול השרת.

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

    /*
מניעת ביצוע שריון או הצטרפות לרשימת המתנה
כאשר בדיקת הזמינות טרם הסתיימה או נכשלה.
*/
    if (!isAvailabilityReady) {
      setError("Book availability must be checked before continuing.");

      return;
    }

    /*
מניעת שריון נוסף או הצטרפות לרשימת המתנה
כאשר המשתמש כבר שריין את אותו הספר
בחלון זמן חופף.
*/
    if (isSelectedReservationBlocked) {
      setError(
        "You have already reserved this book for an overlapping time slot.",
      );

      return;
    }

    /*
מניעת שליחת בקשה נוספת בזמן ביצוע פעולה
או לאחר שהפעולה כבר הסתיימה בהצלחה.
*/
    if (isLoading || successMessage) {
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
        setCompletedAction("reservation");

        /*
רענון נתוני הזמינות מול השרת לאחר שריון מוצלח.

הבדיקה מעדכנת את כמות העותקים הזמינים
ואת רשימת הזמנות הכיסאות החסומות,
כולל הזמנות בחלונות זמן חופפים.
*/
        setAvailability(null);
        setIsAvailabilityLoading(true);
        setAvailabilityRefreshKey((previousKey) => previousKey + 1);

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
      setCompletedAction("waitingList");
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
    blockedReservationIds,
    isSelectedReservationBlocked,
    isBookAvailable,
    availableQuantity,
    isAvailabilityReady,
    isAvailabilityLoading,
    availabilityError,
    isPageLoading,
    isLoading,
    error,
    successMessage,
    completedAction,
    handleReservationChange,
    handleReserveBook,
  };
}
