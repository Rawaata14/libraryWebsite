/*
=========================================================
useMyReservations.js

תיאור הקובץ:
Custom Hook לניהול הזמנות המשתמש המחובר.

מדיניות הביטול:
המשתמש יכול לבטל הזמנה פעילה רק לפני
שעת תחילת ההזמנה לפי שעון ישראל.
=========================================================
*/

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  cancelReservationByUser,
  getReservations,
} from "../services/reservationService";

import {
  getReservationStartDateTime,
  isCancelledStatus,
  splitReservationsByTime,
} from "../utils/reservationUtils";

import { getLibraryDateTimeKey } from "../utils/libraryDateTime";

export default function useMyReservations() {
  const [reservations, setReservations] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("upcoming");

  const [isLoading, setIsLoading] = useState(true);

  const [cancellingReservationId, setCancellingReservationId] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /*
  ---------------------------------------------------------
  fetchReservations
  ---------------------------------------------------------
  */
  const fetchReservations = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await getReservations();

      setReservations(response.data.reservations || []);
    } catch (error) {
      console.error("Error fetching user reservations:", error);

      if (error.response?.status === 401) {
        setErrorMessage("You must be logged in to view your reservations.");
      } else {
        setErrorMessage(
          error.response?.data?.message ||
            "An error occurred while loading your reservations.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  /*
  ---------------------------------------------------------
  canCancelReservation

  תפקיד:
  מאפשרת ביטול רק לפני שעת תחילת ההזמנה.
  ---------------------------------------------------------
  */
  const canCancelReservation = (reservation) => {
    const reservationStart = getReservationStartDateTime(reservation);

    return Boolean(
      reservationStart &&
      reservationStart > getLibraryDateTimeKey() &&
      !isCancelledStatus(reservation.status),
    );
  };

  /*
  ---------------------------------------------------------
  handleCancelReservation
  ---------------------------------------------------------
  */
  const handleCancelReservation = async (reservationId) => {
    const reservation = reservations.find(
      (currentReservation) =>
        currentReservation.reservationId === reservationId,
    );

    if (!reservation || !canCancelReservation(reservation)) {
      setErrorMessage(
        "This reservation can no longer be cancelled because its start time has arrived.",
      );
      return;
    }

    const userConfirmed = window.confirm(
      "Are you sure you want to cancel this reservation?",
    );

    if (!userConfirmed) {
      return;
    }

    try {
      setCancellingReservationId(reservationId);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await cancelReservationByUser(reservationId);

      setReservations((previousReservations) =>
        previousReservations.map((currentReservation) =>
          currentReservation.reservationId === reservationId
            ? {
                ...currentReservation,
                status: "cancelled",
              }
            : currentReservation,
        ),
      );

      setSuccessMessage(
        response.data?.message || "Reservation cancelled successfully.",
      );
    } catch (error) {
      console.error("Error cancelling user reservation:", error);

      if (error.response?.status === 401) {
        setErrorMessage("You must be logged in to cancel a reservation.");
      } else if (error.response?.status === 404) {
        setErrorMessage(
          error.response?.data?.message || "The reservation was not found.",
        );
      } else if (error.response?.status === 409) {
        setErrorMessage(
          error.response?.data?.message ||
            "This reservation can no longer be cancelled.",
        );
      } else {
        setErrorMessage(
          error.response?.data?.message ||
            "An error occurred while cancelling the reservation.",
        );
      }
    } finally {
      setCancellingReservationId(null);
    }
  };

  /*
  ---------------------------------------------------------
  חלוקת ההזמנות

  החישוב מתעדכן גם פעם בדקה כדי שהזמנה שעברה
  את שעת הסיום תעבור ל-History בלי רענון ידני.
  ---------------------------------------------------------
  */
  const [currentDateTimeKey, setCurrentDateTimeKey] = useState(
    getLibraryDateTimeKey(),
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentDateTimeKey(getLibraryDateTimeKey());
    }, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const { upcomingReservations, pastReservations } = useMemo(
    () => splitReservationsByTime(reservations, currentDateTimeKey),
    [reservations, currentDateTimeKey],
  );

  const displayedReservations = useMemo(() => {
    if (selectedFilter === "upcoming") {
      return upcomingReservations;
    }

    if (selectedFilter === "past") {
      return pastReservations;
    }

    return reservations;
  }, [pastReservations, reservations, selectedFilter, upcomingReservations]);

  return {
    reservations,
    upcomingReservations,
    pastReservations,
    displayedReservations,
    selectedFilter,
    setSelectedFilter,
    isLoading,
    cancellingReservationId,
    errorMessage,
    clearErrorMessage: () => setErrorMessage(""),
    successMessage,
    clearSuccessMessage: () => setSuccessMessage(""),
    fetchReservations,
    handleCancelReservation,
    canCancelReservation,
  };
}
