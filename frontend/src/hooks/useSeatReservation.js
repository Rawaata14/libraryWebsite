/*
=========================================================
useSeatReservation.js

תיאור הקובץ:
Custom Hook לניהול הזמנת מקום והצטרפות
לרשימת המתנה מתוך מפת הספרייה.

אחריות:
- טעינת חלונות הזמן.
- בחירת תאריך ושעה.
- בחירת מקום פנוי או תפוס.
- יצירת הזמנה למקום פנוי.
- הצטרפות לרשימת המתנה למקום תפוס.
- פתיחת המפה מתוך הצעה פעילה.
- רענון מצב המפה לאחר פעולה.

כל חישובי התאריך מתבצעים לפי אזור הזמן
של הספרייה בישראל.
=========================================================
*/

import { useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";

import {
  createSeatReservation,
  getAvailableReservationSlots,
} from "../services/reservationService";

import { joinSeatWaitingList } from "../services/waitingListService";

import {
  getLibraryDateTimeKey,
  getLibraryDateValue,
} from "../utils/libraryDateTime";

/*
---------------------------------------------------------
WAITING_LIST_SEAT_STATUSES

תפקיד:
מגדיר את מצבי המקום שמאפשרים הצטרפות
לרשימת המתנה.

available:
המקום ניתן להזמנה רגילה.

blocked:
מקום חסום מנהלית ואינו ניתן להזמנה או להמתנה.
---------------------------------------------------------
*/
const WAITING_LIST_SEAT_STATUSES = ["occupied", "reserved", "unavailable"];

/*
---------------------------------------------------------
normalizeSeatStatus

תפקיד:
מחזירה את מצב המקום באותיות קטנות.
---------------------------------------------------------
*/
function normalizeSeatStatus(seat) {
  return String(seat?.status || "").toLowerCase();
}

/*
---------------------------------------------------------
normalizeTime

תפקיד:
מחזירה שעה בפורמט HH:MM.

השרת עשוי להחזיר שעה בפורמט HH:MM:SS,
בעוד חלונות הזמן בממשק משתמשים ב-HH:MM.
---------------------------------------------------------
*/
function normalizeTime(value) {
  if (!value) {
    return "";
  }

  const match = String(value).match(/^(\d{2}):(\d{2})/);

  if (!match) {
    return "";
  }

  return `${match[1]}:${match[2]}`;
}

/*
---------------------------------------------------------
getWaitingListOffer

תפקיד:
מחזירה את פרטי ההצעה שהועברו מדף רשימות
ההמתנה אל המפה.

אם אין הצעה פעילה או שהמידע חסר, מוחזר null.
---------------------------------------------------------
*/
function getWaitingListOffer(locationState) {
  const offer = locationState?.waitingListOffer;

  if (!offer?.seatId || !offer?.date || !offer?.startTime || !offer?.endTime) {
    return null;
  }

  const startTime = normalizeTime(offer.startTime);

  const endTime = normalizeTime(offer.endTime);

  if (!startTime || !endTime) {
    return null;
  }

  return {
    seatId: offer.seatId,
    date: String(offer.date).slice(0, 10),
    startTime,
    endTime,
  };
}

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
useSeatReservation

תפקיד:
מספק למפת הספרייה את הנתונים והפעולות הנדרשים
להזמנה רגילה ולהצטרפות לרשימת המתנה.
---------------------------------------------------------
*/
export default function useSeatReservation() {
  const navigate = useNavigate();

  const location = useLocation();

  const { user } = useContext(AuthContext);

  /*
  ---------------------------------------------------------
  waitingListOffer

  תפקיד:
  שומרת את פרטי ההצעה שהמשתמש פתח מתוך דף
  רשימות ההמתנה.

  useMemo מונע יצירת אובייקט חדש בכל רינדור.
  ---------------------------------------------------------
  */
  const waitingListOffer = useMemo(
    () => getWaitingListOffer(location.state),
    [location.state],
  );

  const minimumDate = getLibraryDateValue();

  /*
  אם ההצעה מתייחסת לתאריך תקף, המפה נפתחת
  ישירות באותו תאריך.
  */
  const initialDate =
    waitingListOffer?.date && waitingListOffer.date >= minimumDate
      ? waitingListOffer.date
      : minimumDate;

  /*
  אם קיימת הצעה, חלון הזמן שלה נבחר מראש.
  */
  const initialTime = waitingListOffer
    ? `${waitingListOffer.startTime} - ${waitingListOffer.endTime}`
    : "";

  const [selectedDate, setSelectedDate] = useState(initialDate);

  const [availableSlots, setAvailableSlots] = useState([]);

  const [selectedTime, setSelectedTime] = useState(initialTime);

  const [selectedSeat, setSelectedSeat] = useState(null);

  /*
  offeredSeatId משמש לסימון חזותי של המקום
  שהוצע למשתמש במפה.

  המשתמש עדיין לוחץ על המקום כדי לפתוח את
  חלון האישור ולראות את כל הפרטים.
  */
  const [offeredSeatId, setOfferedSeatId] = useState(
    waitingListOffer?.seatId || null,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [mapRefreshKey, setMapRefreshKey] = useState(0);

  const [reservationFeedback, setReservationFeedback] = useState(
    waitingListOffer
      ? {
          type: "success",
          message:
            `Seat ${waitingListOffer.seatId} is available for you. ` +
            "Select the highlighted seat and confirm before the offer expires.",
        }
      : null,
  );

  /*
  ---------------------------------------------------------
  fetchAvailableSlots

  תפקיד:
  טוענת את חלונות הזמן העתידיים עבור התאריך.

  חלון שבו כל המקומות תפוסים עדיין מוחזר,
  משום שניתן להשתמש בו להצטרפות לתור.
  ---------------------------------------------------------
  */
  const fetchAvailableSlots = useCallback(async (date) => {
    try {
      const response = await getAvailableReservationSlots(date);

      const slots = response.data.slots || [];

      setAvailableSlots(slots);

      setSelectedTime((currentSelectedTime) => {
        if (slots.length === 0) {
          return "";
        }

        if (slots.includes(currentSelectedTime)) {
          return currentSelectedTime;
        }

        return slots[0];
      });
    } catch (error) {
      console.error("Error fetching available slots:", error);

      setAvailableSlots([]);

      setSelectedTime("");

      setReservationFeedback({
        type: "error",
        message: "The available times could not be loaded.",
      });
    }
  }, []);

  /*
  ---------------------------------------------------------
  טעינת חלונות הזמן לאחר שינוי התאריך
  ---------------------------------------------------------
  */
  useEffect(() => {
    fetchAvailableSlots(selectedDate);
  }, [fetchAvailableSlots, selectedDate]);

  /*
  ---------------------------------------------------------
  isSelectedSeatAvailable

  תפקיד:
  קובעת אם המקום שנבחר פנוי להזמנה רגילה.

  אם הערך false והמקום תפוס, הפעולה תהיה
  הצטרפות לרשימת המתנה.
  ---------------------------------------------------------
  */
  const isSelectedSeatAvailable =
    normalizeSeatStatus(selectedSeat) === "available";

  /*
  ---------------------------------------------------------
  handleSeatSelect

  תפקיד:
  מאפשרת לבחור:
  - מקום פנוי לצורך הזמנה.
  - מקום תפוס לצורך הצטרפות לרשימת המתנה.

  מקום חסום מנהלית אינו ניתן לבחירה.
  ---------------------------------------------------------
  */
  const handleSeatSelect = (seat) => {
    if (!seat) {
      return;
    }

    const seatStatus = normalizeSeatStatus(seat);

    const canReserve = seatStatus === "available";

    const canJoinWaitingList = WAITING_LIST_SEAT_STATUSES.includes(seatStatus);

    if (!canReserve && !canJoinWaitingList) {
      setReservationFeedback({
        type: "error",
        message:
          seatStatus === "blocked"
            ? "This seat is blocked and cannot be reserved."
            : "This seat cannot be selected.",
      });

      return;
    }

    /*
    אם המשתמש הגיע מהצעה פעילה, המקום שהוצע
    לו אמור להיות המקום שאותו הוא בוחר.

    עדיין אין הסתמכות אבטחתית על בדיקה זו.
    השרת בודק מחדש למי שייכת ההצעה.
    */
    if (
      waitingListOffer &&
      String(seat.id) !== String(waitingListOffer.seatId)
    ) {
      setReservationFeedback({
        type: "error",
        message: `Your active offer is for seat ${waitingListOffer.seatId}.`,
      });

      return;
    }

    setReservationFeedback(null);

    setSelectedSeat(seat);
  };

  /*
  ---------------------------------------------------------
  closeReservationDialog

  תפקיד:
  סוגרת את חלון הפעולה אם לא מתבצעת כרגע
  בקשה לשרת.
  ---------------------------------------------------------
  */
  const closeReservationDialog = useCallback(() => {
    if (isSubmitting) {
      return;
    }

    setSelectedSeat(null);
  }, [isSubmitting]);

  /*
  ---------------------------------------------------------
  handleDateChange

  תפקיד:
  מעדכנת את התאריך ומנקה בחירה קודמת.

  שינוי ידני של התאריך מבטל את הסימון החזותי
  של ההצעה שהועברה לדף.
  ---------------------------------------------------------
  */
  const handleDateChange = (date) => {
    if (!date || date < minimumDate) {
      return;
    }

    setSelectedDate(date);

    setSelectedSeat(null);

    setOfferedSeatId(null);

    setReservationFeedback(null);
  };

  /*
  ---------------------------------------------------------
  handleTimeChange

  תפקיד:
  מעדכנת את חלון הזמן ומנקה את המקום שנבחר.

  שינוי ידני של השעה מבטל את הסימון החזותי
  של ההצעה שהועברה לדף.
  ---------------------------------------------------------
  */
  const handleTimeChange = (time) => {
    setSelectedTime(time);

    setSelectedSeat(null);

    setOfferedSeatId(null);

    setReservationFeedback(null);
  };

  /*
  ---------------------------------------------------------
  handleConfirmReservation

  תפקיד:
  מבצעת את הפעולה המתאימה לפי מצב המקום.

  מקום פנוי:
  נוצרת הזמנת מקום רגילה.

  מקום תפוס:
  נוצרת רשומת המתנה עבור המקום, התאריך
  וטווח הזמן שנבחרו.

  כאשר קיימת הצעה פעילה:
  המקום אמור להופיע כפנוי וההזמנה מסומנת
  בשרת כמימוש של ההצעה.
  ---------------------------------------------------------
  */
  const handleConfirmReservation = async () => {
    if (!user) {
      navigate("/login");

      return;
    }

    if (!selectedSeat || !selectedTime) {
      setReservationFeedback({
        type: "error",
        message: "Please select a seat and time.",
      });

      return;
    }

    const seatStatus = normalizeSeatStatus(selectedSeat);

    const canReserve = seatStatus === "available";

    const canJoinWaitingList = WAITING_LIST_SEAT_STATUSES.includes(seatStatus);

    if (!canReserve && !canJoinWaitingList) {
      setReservationFeedback({
        type: "error",
        message:
          "The selected seat cannot be reserved or added to a waiting list.",
      });

      return;
    }

    const [startTime, endTime] = selectedTime.split(" - ");

    if (!startTime || !endTime) {
      setReservationFeedback({
        type: "error",
        message: "The selected reservation time is invalid.",
      });

      return;
    }

    const selectedStartKey = `${selectedDate}T${String(startTime).substring(
      0,
      5,
    )}`;

    if (selectedStartKey <= getLibraryDateTimeKey()) {
      setReservationFeedback({
        type: "error",
        message: "A reservation must start later than the current time.",
      });

      await fetchAvailableSlots(selectedDate);

      return;
    }

    setIsSubmitting(true);

    setReservationFeedback(null);

    try {
      /*
        -----------------------------------------------------
        יצירת הזמנה עבור מקום פנוי
        -----------------------------------------------------
        */
      if (canReserve) {
        const response = await createSeatReservation({
          seatId: selectedSeat.id,
          date: selectedDate,
          startTime,
          endTime,
        });

        if (response.status !== 200 && response.status !== 201) {
          throw new Error("The reservation could not be completed.");
        }

        setReservationFeedback({
          type: "success",
          message:
            `Seat ${selectedSeat.id} was reserved for ` +
            `${selectedDate}, ${selectedTime}.`,
        });
      } else {
        /*
          ---------------------------------------------------
          הצטרפות לרשימת המתנה עבור מקום תפוס

          השרת בודק מחדש:
          - שהמקום קיים.
          - שהמקום אכן תפוס בטווח שנבחר.
          - שאין למשתמש הזמנה חופפת.
          - שאין כבר רשומת המתנה פעילה זהה.
          ---------------------------------------------------
          */
        const result = await joinSeatWaitingList({
          seatId: selectedSeat.id,
          date: selectedDate,
          startTime,
          endTime,
        });

        setReservationFeedback({
          type: "success",
          message:
            result.message ||
            `You joined the waiting list for seat ${selectedSeat.id}.`,
        });
      }

      setSelectedSeat(null);

      setOfferedSeatId(null);

      setMapRefreshKey((currentKey) => currentKey + 1);

      await fetchAvailableSlots(selectedDate);
    } catch (error) {
      console.error(
        canReserve
          ? "Error confirming seat reservation:"
          : "Error joining seat waiting list:",
        error,
      );

      setReservationFeedback({
        type: "error",
        message: getRequestErrorMessage(
          error,
          canReserve
            ? "An error occurred while confirming the reservation."
            : "Failed to join the seat waiting list.",
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    minimumDate,
    selectedDate,
    availableSlots,
    selectedTime,
    selectedSeat,
    offeredSeatId,
    isSelectedSeatAvailable,
    isSubmitting,
    mapRefreshKey,
    reservationFeedback,
    handleSeatSelect,
    closeReservationDialog,
    handleDateChange,
    handleTimeChange,
    handleConfirmReservation,
  };
}
