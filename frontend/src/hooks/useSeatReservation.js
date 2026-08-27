/*
=========================================================
useSeatReservation.js

תיאור הקובץ:
Custom Hook לניהול תהליך הזמנת מקום במפה.

כל חישובי התאריך מתבצעים לפי אזור הזמן של ישראל.
=========================================================
*/

import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";

import {
  createSeatReservation,
  getAvailableReservationSlots,
} from "../services/reservationService";

import {
  getLibraryDateTimeKey,
  getLibraryDateValue,
} from "../utils/libraryDateTime";

export default function useSeatReservation() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [selectedDate, setSelectedDate] = useState(getLibraryDateValue());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapRefreshKey, setMapRefreshKey] = useState(0);
  const [reservationFeedback, setReservationFeedback] = useState(null);

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

  useEffect(() => {
    fetchAvailableSlots(selectedDate);
  }, [fetchAvailableSlots, selectedDate]);

  const handleSeatSelect = (seat) => {
    if (!seat || seat.status !== "available") {
      return;
    }

    setReservationFeedback(null);
    setSelectedSeat(seat);
  };

  const closeReservationDialog = useCallback(() => {
    if (isSubmitting) {
      return;
    }

    setSelectedSeat(null);
  }, [isSubmitting]);

  const handleDateChange = (date) => {
    if (!date || date < getLibraryDateValue()) {
      return;
    }

    setSelectedDate(date);
    setSelectedSeat(null);
    setReservationFeedback(null);
  };

  const handleTimeChange = (time) => {
    setSelectedTime(time);
    setSelectedSeat(null);
    setReservationFeedback(null);
  };

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
        message:
          `Seat ${selectedSeat.id} was reserved for ` +
          `${selectedDate}, ${selectedTime}.`,
      });

      setSelectedSeat(null);
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
    minimumDate: getLibraryDateValue(),
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
