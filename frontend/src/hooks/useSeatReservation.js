/*
=========================================================
useSeatReservation.js

תיאור הקובץ:
Custom Hook לניהול תהליך הזמנת מקום במפה.

ה-Hook אחראי על:
- ניהול התאריך והשעה שנבחרו.
- טעינת שעות פנויות.
- ניהול הכיסא שנבחר.
- אימות נתוני ההזמנה.
- יצירת הזמנה חדשה.
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
מחזירה את התאריך הנוכחי בפורמט YYYY-MM-DD,
המתאים לשדה input מסוג date.
---------------------------------------------------------
*/
const getTodayDateValue = () => new Date().toISOString().split("T")[0];

/*
---------------------------------------------------------
useSeatReservation

תפקיד:
מספק לדף המפה את הנתונים והפעולות
הדרושים לבחירת מקום וליצירת הזמנה.
---------------------------------------------------------
*/
export default function useSeatReservation() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [selectedDate, setSelectedDate] = useState(getTodayDateValue());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedSeat, setSelectedSeat] = useState(null);

  /*
  ---------------------------------------------------------
  fetchAvailableSlots

  תפקיד:
  טוענת מהשרת את השעות הפנויות לתאריך שנבחר
  ושומרת בחירה קיימת אם היא עדיין זמינה.
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
    }
  }, []);

  /*
  ---------------------------------------------------------
  טעינת שעות פנויות

  תפקיד:
  מרעננת את השעות בכל פעם שהתאריך משתנה.
  ---------------------------------------------------------
  */
  useEffect(() => {
    fetchAvailableSlots(selectedDate);
  }, [fetchAvailableSlots, selectedDate]);

  /*
  ---------------------------------------------------------
  handleDateChange

  תפקיד:
  מעדכנת את התאריך ומנקה את הכיסא שנבחר,
  משום שזמינות הכיסאות תלויה בתאריך.
  ---------------------------------------------------------
  */
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSeat(null);
  };

  /*
  ---------------------------------------------------------
  handleTimeChange

  תפקיד:
  מעדכנת את השעה ומנקה את הכיסא שנבחר,
  משום שזמינות הכיסאות תלויה בשעה.
  ---------------------------------------------------------
  */
  const handleTimeChange = (time) => {
    setSelectedTime(time);
    setSelectedSeat(null);
  };

  /*
  ---------------------------------------------------------
  handleConfirmReservation

  תפקיד:
  מאמתת את המשתמש ואת פרטי הבחירה,
  ולאחר מכן שולחת בקשה ליצירת ההזמנה.
  ---------------------------------------------------------
  */
  const handleConfirmReservation = async () => {
    if (!user) {
      window.alert("User not logged in. Please log in to reserve a seat.");

      navigate("/login");
      return;
    }

    if (!selectedSeat) {
      window.alert("יש לבחור כיסא לפני אישור ההזמנה");
      return;
    }

    if (selectedSeat.status !== "available") {
      window.alert("הכיסא הנבחר אינו פנוי להזמנה");
      return;
    }

    if (!selectedTime) {
      window.alert("יש לבחור שעה תקינה להזמנה");
      return;
    }

    const [startTime, endTime] = selectedTime.split(" - ");

    if (!startTime || !endTime) {
      window.alert("פורמט שעת ההזמנה אינו תקין");
      return;
    }

    try {
      const response = await createSeatReservation({
        seatId: selectedSeat.id,
        date: selectedDate,
        startTime,
        endTime,
      });

      if (response.status !== 200 && response.status !== 201) {
        window.alert("The reservation could not be completed.");
        return;
      }

      window.alert(
        `ההזמנה אושרה עבור כיסא שמספרו: ${selectedSeat.id}\nתאריך: ${selectedDate}\nשעה: ${selectedTime}`,
      );

      /*
        אין לשנות ישירות את selectedSeat.status.
        לאחר הצלחה מנקים את הבחירה ומרעננים
        את נתוני הזמינות מהשרת.
      */
      setSelectedSeat(null);

      await fetchAvailableSlots(selectedDate);
    } catch (error) {
      console.error("Error confirming seat reservation:", error);

      window.alert(
        error.response?.data?.message ||
          "An error occurred while confirming the reservation.",
      );
    }
  };

  return {
    minimumDate: getTodayDateValue(),
    selectedDate,
    availableSlots,
    selectedTime,
    selectedSeat,
    setSelectedSeat,
    handleDateChange,
    handleTimeChange,
    handleConfirmReservation,
  };
}
