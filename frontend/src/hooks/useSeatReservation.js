/*
=========================================================
useSeatReservation.js

תיאור הקובץ:
Custom Hook לניהול תהליך הזמנת מקום במפה.

ה-Hook אחראי על:
- ניהול התאריך והשעה שנבחרו.
- טעינת שעות פנויות.
- ניהול הכיסא שנבחר.
- פתיחה וסגירה של חלון ההזמנה.
- אימות נתוני ההזמנה.
- יצירת הזמנה חדשה.
- הצגת משוב הצלחה או שגיאה.
=========================================================
*/

import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";

import {
  createSeatReservation,
  getAvailableReservationSlots,
} from "../services/reservationService";

/*
---------------------------------------------------------
getTodayDateValue

תפקיד:
מחזירה את התאריך הנוכחי בפורמט YYYY-MM-DD.
---------------------------------------------------------
*/
const getTodayDateValue = () => new Date().toISOString().split("T")[0];

/*
---------------------------------------------------------
useSeatReservation

תפקיד:
מספק לדף המפה את הנתונים והפעולות הדרושים
לבחירת מקום וליצירת הזמנה.
---------------------------------------------------------
*/
export default function useSeatReservation() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [selectedDate, setSelectedDate] = useState(getTodayDateValue());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapRefreshKey, setMapRefreshKey] = useState(0);
  const [reservationFeedback, setReservationFeedback] = useState(null);

  /*
  -------------------------------------------------------
  fetchAvailableSlots

  תפקיד:
  טוענת מהשרת את השעות הפנויות לתאריך שנבחר
  ושומרת בחירה קיימת אם היא עדיין זמינה.
  -------------------------------------------------------
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
  -------------------------------------------------------
  טעינת שעות פנויות

  תפקיד:
  מרעננת את השעות בכל פעם שהתאריך משתנה.
  -------------------------------------------------------
  */
  useEffect(() => {
    fetchAvailableSlots(selectedDate);
  }, [fetchAvailableSlots, selectedDate]);

  /*
  -------------------------------------------------------
  handleSeatSelect

  תפקיד:
  שומרת כיסא פנוי שנבחר ופותחת את חלון
  סיכום ההזמנה.
  -------------------------------------------------------
  */
  const handleSeatSelect = (seat) => {
    if (!seat || seat.status !== "available") {
      return;
    }

    setReservationFeedback(null);
    setSelectedSeat(seat);
  };

  /*
  -------------------------------------------------------
  closeReservationDialog

  תפקיד:
  סוגרת את חלון ההזמנה ומנקה את בחירת הכיסא.
  -------------------------------------------------------
  */
  const closeReservationDialog = useCallback(() => {
    if (isSubmitting) {
      return;
    }

    setSelectedSeat(null);
  }, [isSubmitting]);

  /*
  -------------------------------------------------------
  handleDateChange

  תפקיד:
  מעדכנת את התאריך ומנקה את הכיסא שנבחר.
  -------------------------------------------------------
  */
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSeat(null);
    setReservationFeedback(null);
  };

  /*
  -------------------------------------------------------
  handleTimeChange

  תפקיד:
  מעדכנת את השעה ומנקה את הכיסא שנבחר.
  -------------------------------------------------------
  */
  const handleTimeChange = (time) => {
    setSelectedTime(time);
    setSelectedSeat(null);
    setReservationFeedback(null);
  };

  /*
  -------------------------------------------------------
  handleConfirmReservation

  תפקיד:
  מאמתת את פרטי הבחירה ושולחת בקשה ליצירת
  ההזמנה. לאחר הצלחה מרעננת את המפה.
  -------------------------------------------------------
  */
  const handleConfirmReservation = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!selectedSeat || selectedSeat.status !== "available" || !selectedTime) {
      setReservationFeedback({
        type: "error",
        message: "Please select an available seat and time.",
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

    setIsSubmitting(true);
    setReservationFeedback(null);

    try {
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
        message: `Seat ${selectedSeat.id} was reserved for ${selectedDate}, ${selectedTime}.`,
      });

      setSelectedSeat(null);

      /*
      שינוי המפתח גורם למפה להיטען מחדש
      ולהציג את סטטוס הכיסאות המעודכן.
      */
      setMapRefreshKey((currentKey) => currentKey + 1);

      await fetchAvailableSlots(selectedDate);
    } catch (error) {
      console.error("Error confirming seat reservation:", error);

      setReservationFeedback({
        type: "error",
        message:
          error.response?.data?.message ||
          error.message ||
          "An error occurred while confirming the reservation.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    minimumDate: getTodayDateValue(),
    selectedDate,
    availableSlots,
    selectedTime,
    selectedSeat,
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
