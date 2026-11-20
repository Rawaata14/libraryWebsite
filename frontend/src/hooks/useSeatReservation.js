/*
=========================================================
useSeatReservation.js

תיאור הקובץ:
Custom Hook לניהול הזמנת מקום והצטרפות
לרשימת המתנה מתוך מפת הספרייה (כולל תמיכה בשולחנות קבוצתיים).

אחריות:
- טעינת חלונות הזמן.
- בחירת תאריך ושעה.
- בחירת מקום פנוי או תפוס (כיסא בודד או שולחן קבוצתי).
- יצירת הזמנה למקום פנוי / הזמנה קבוצתית לשולחן.
- הצטרפות לרשימת המתנה למקום תפוס.
- פתיחת המפה מתוך הצעה פעילה.
- רענון מצב המפה לאחר פעולה.

כל חישובי התאריך מתבצעים לפי אזור הזמן
של הספרייה בישראל.
=========================================================
*/

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

import {
  createSeatReservation,
  createTableReservation,
  getAvailableReservationSlots,
} from "../services/reservationService";

import {
  joinSeatWaitingList,
  joinGeneralSeatWaitingList,
} from "../services/waitingListService";

import {
  getLibraryDateTimeKey,
  getLibraryDateValue,
} from "../utils/libraryDateTime";

/*
---------------------------------------------------------
WAITING_LIST_SEAT_STATUSES

תפקיד:
מגדיר את מצבי המקום שמאפשרים הצטרפות לרשימת המתנה.
---------------------------------------------------------
*/
const WAITING_LIST_SEAT_STATUSES = ["occupied", "reserved", "unavailable"];

/*
---------------------------------------------------------
normalizeSeatStatus
---------------------------------------------------------
*/
function normalizeSeatStatus(seat) {
  return String(seat?.status || "").toLowerCase();
}

/*
---------------------------------------------------------
normalizeTime
---------------------------------------------------------
*/
function normalizeTime(value) {
  if (!value) return "";
  const match = String(value).match(/^(\d{2}):(\d{2})/);
  if (!match) return "";
  return `${match[1]}:${match[2]}`;
}

/*
---------------------------------------------------------
getWaitingListOffer
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
להזמנה רגילה, הזמנת שולחן קבוצתי ולהצטרפות לרשימת המתנה.
---------------------------------------------------------
*/
export default function useSeatReservation({
  items = [],
  fetchLatestSeats,
  isMapConnectionError = false,
} = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const waitingListOffer = useMemo(
    () => getWaitingListOffer(location.state),
    [location.state],
  );

  const minimumDate = getLibraryDateValue();

  const initialDate =
    waitingListOffer?.date && waitingListOffer.date >= minimumDate
      ? waitingListOffer.date
      : minimumDate;

  const initialTime = waitingListOffer
    ? `${waitingListOffer.startTime} - ${waitingListOffer.endTime}`
    : "";

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(initialTime);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const previousConnectionError = useRef(isMapConnectionError);

  /*
  ---------------------------------------------------------
  groupSize
  תפקיד:
  שומר את מספר המקומות המבוקש עבור הזמנה קבוצתית לשולחן.
  ---------------------------------------------------------
  */
  const [groupSize, setGroupSize] = useState(2);

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
  ---------------------------------------------------------
  */
  const fetchAvailableSlots = useCallback(async (date) => {
    try {
      const response = await getAvailableReservationSlots(date);
      const slots = response.data.slots || [];

      setAvailableSlots(slots);

      setSelectedTime((currentSelectedTime) => {
        if (slots.length === 0) return "";
        if (slots.includes(currentSelectedTime)) return currentSelectedTime;
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

  useEffect(() => {
    fetchAvailableSlots(selectedDate);
  }, [fetchAvailableSlots, selectedDate]);

  // טעינת שעות כאשר התאריך משתנה
  useEffect(() => {
    fetchAvailableSlots(selectedDate);
  }, [fetchAvailableSlots, selectedDate]);

  // טעינת שעות מחדש לאחר חזרת החיבור
  useEffect(() => {
    const wasDisconnected = previousConnectionError.current;

    previousConnectionError.current = isMapConnectionError;

    if (wasDisconnected && !isMapConnectionError && selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [isMapConnectionError, selectedDate, fetchAvailableSlots]);

  /*
  ---------------------------------------------------------
  isTable & isSelectedSeatAvailable

  תפקיד:
  זיהוי האם הוכנסה יחידה של שולחן (כגון table-4 או table-8).
  ---------------------------------------------------------
  */
  const isTable = Boolean(
    selectedSeat?.type?.includes("table") ||
    String(selectedSeat?.type || "").startsWith("table-") ||
    selectedSeat?.type === "table-4" ||
    selectedSeat?.type === "table-8" ||
    String(selectedSeat?.seatId || "").includes("table"),
  );

  const isSelectedSeatAvailable =
    isTable || normalizeSeatStatus(selectedSeat) === "available";

  /*
  ---------------------------------------------------------
  handleSeatSelect

  תפקיד:
  טיפול בלחיצה על פריט במפה (כיסא יחיד או שולחן).
  ---------------------------------------------------------
  */
  const handleSeatSelect = (seat) => {
    if (!seat) return;

    const seatStatus = normalizeSeatStatus(seat);
    const isItemTable = Boolean(
      seat.type?.includes("table") ||
      String(seat.type || "").startsWith("table-") ||
      seat.type === "table-4" ||
      seat.type === "table-8" ||
      String(seat.seatId || "").includes("table"),
    );

    const canReserveTable = isItemTable && seatStatus !== "blocked";
    const canReserveSeat = seatStatus === "available";
    const canJoinWaitingList = WAITING_LIST_SEAT_STATUSES.includes(seatStatus);

    if (!canReserveTable && !canReserveSeat && !canJoinWaitingList) {
      setReservationFeedback({
        type: "error",
        message:
          seatStatus === "blocked"
            ? "This item is blocked and cannot be reserved."
            : "This item cannot be selected.",
      });
      return;
    }

    if (
      waitingListOffer &&
      String(seat.id ?? seat.seatId) !== String(waitingListOffer.seatId)
    ) {
      setReservationFeedback({
        type: "error",
        message: `Your active offer is for seat ${waitingListOffer.seatId}.`,
      });
      return;
    }

    setReservationFeedback(null);
    setSelectedSeat(seat);

    // התאמת גודל הקבוצה למספר הכיסאות הפנויים
    if (isItemTable) {
      const minGroupSize = seat.type === "table-8" ? 5 : 1;
      const preferredGroupSize = seat.type === "table-8" ? 5 : 2;

      const availableSeatsCount = items.filter(
        (item) =>
          String(item.tableId) === String(seat.id ?? seat.seatId) &&
          String(item.status).toLowerCase() === "available",
      ).length;

      const defaultGroupSize =
        availableSeatsCount >= minGroupSize
          ? Math.min(preferredGroupSize, availableSeatsCount)
          : 0;

      setGroupSize(defaultGroupSize);
    }
  };

  /*
  ---------------------------------------------------------
  closeReservationDialog
  ---------------------------------------------------------
  */
  const closeReservationDialog = useCallback(() => {
    if (isSubmitting) return;
    setSelectedSeat(null);
  }, [isSubmitting]);

  /*
  ---------------------------------------------------------
  handleDateChange
  ---------------------------------------------------------
  */
  const handleDateChange = (date) => {
    if (!date || date < minimumDate) return;
    setSelectedDate(date);
    setSelectedSeat(null);
    setOfferedSeatId(null);
    setReservationFeedback(null);
  };

  /*
  ---------------------------------------------------------
  handleTimeChange
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
  ביצוע ההזמנה בפועל. בודק אם מדובר בשולחן (שולח קריאת reserve-table)
  או בכיסא (שולח קריאה ל-reserve-seat / רשימת המתנה).
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
        message: "Please select a seat/table and time.",
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

    const selectedStartKey = `${selectedDate}T${String(startTime).substring(0, 5)}`;

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

    // מציאת מזהה השולחן או הכיסא בצורה בטוחה
    const targetSeatId = selectedSeat.id ?? selectedSeat.seatId;

    try {
      if (isTable) {
        /*
        ---------------------------------------------------
        יצירת הזמנה קבוצתית לשולחן
        ---------------------------------------------------
        */
        const response = await createTableReservation({
          tableId: targetSeatId,
          groupSize,
          date: selectedDate,
          startTime,
          endTime,
        });

        if (response.status !== 200 && response.status !== 201) {
          throw new Error(
            "The table group reservation could not be completed.",
          );
        }

        setReservationFeedback({
          type: "success",
          message: `Table ${targetSeatId} was successfully reserved for ${groupSize} people on ${selectedDate}, ${selectedTime}.`,
        });
      } else {
        /*
        ---------------------------------------------------
        יצירת הזמנה לכיסא יחיד / הצטרפות לרשימת המתנה
        ---------------------------------------------------
        */
        const seatStatus = normalizeSeatStatus(selectedSeat);
        const canReserve = seatStatus === "available";

        if (canReserve) {
          const response = await createSeatReservation({
            seatId: targetSeatId,
            date: selectedDate,
            startTime,
            endTime,
          });

          if (response.status !== 200 && response.status !== 201) {
            throw new Error("The reservation could not be completed.");
          }

          setReservationFeedback({
            type: "success",
            message: `Seat ${targetSeatId} was reserved for ${selectedDate}, ${selectedTime}.`,
          });
        } else {
          const result = await joinGeneralSeatWaitingList({
            requestedDate: selectedDate,
            requestedStartTime: startTime,
            requestedEndTime: endTime,
          });

          setReservationFeedback({
            type: "success",
            message:
              result.message ||
              `You successfully joined the waiting list for ${selectedDate}, ${startTime} - ${endTime}.`,
          });
        }
      }

      setOfferedSeatId(null);
      setMapRefreshKey((currentKey) => currentKey + 1);
      if (fetchLatestSeats) {
        await fetchLatestSeats();
      }
      await fetchAvailableSlots(selectedDate);
    } catch (error) {
      console.error("Error confirming reservation:", error);
      setReservationFeedback({
        type: "error",
        message: getRequestErrorMessage(
          error,
          "An error occurred while confirming the reservation.",
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
    groupSize,
    setGroupSize,
    isTable,
    items,
    handleSeatSelect,
    closeReservationDialog,
    handleDateChange,
    handleTimeChange,
    handleConfirmReservation,
  };
}
