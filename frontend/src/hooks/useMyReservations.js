/*
=========================================================
useMyReservations.js

תיאור הקובץ:
Custom Hook לניהול הזמנות המשתמש המחובר.

ה-Hook אחראי על:
- טעינת הזמנות המשתמש.
- חלוקה להזמנות עתידיות ולהיסטוריה.
- סינון הרשימה המוצגת.
- ביטול הזמנה עתידית.
- ניהול מצבי טעינה והודעות משוב.
=========================================================
*/

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  cancelReservationByUser,
  getReservations,
} from "../services/reservationService";

import {
  getReservationEndDateTime,
  isCancelledStatus,
  splitReservationsByTime,
} from "../utils/reservationUtils";

/*
---------------------------------------------------------
useMyReservations

תפקיד:
מספק לדף My Reservations את הנתונים והפעולות
הדרושים להצגת הזמנות המשתמש ולביטולן.
---------------------------------------------------------
*/
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

  תפקיד:
  טוענת מהשרת את ההזמנות השייכות למשתמש המחובר.
  השרת מזהה את המשתמש באמצעות ה-session.
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

  /*
  ---------------------------------------------------------
  טעינת ההזמנות

  תפקיד:
  מפעילה את שליפת ההזמנות כאשר הדף נטען.
  ---------------------------------------------------------
  */
  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  /*
  ---------------------------------------------------------
  handleCancelReservation

  תפקיד:
  מבקשת אישור מהמשתמש, שולחת בקשת ביטול
  ומעדכנת את סטטוס ההזמנה ברשימה המקומית.
  ---------------------------------------------------------
  */
  const handleCancelReservation = async (reservationId) => {
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
        previousReservations.map((reservation) =>
          reservation.reservationId === reservationId
            ? {
                ...reservation,
                status: "cancelled",
              }
            : reservation,
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

  תפקיד:
  מחשבת מחדש את הרשימות רק כאשר נתוני
  ההזמנות משתנים.
  ---------------------------------------------------------
  */
  const { upcomingReservations, pastReservations } = useMemo(
    () => splitReservationsByTime(reservations),
    [reservations],
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

  /*
  ---------------------------------------------------------
  canCancelReservation

  תפקיד:
  בודקת אם ההזמנה עדיין עתידית ולא בוטלה.
  ---------------------------------------------------------
  */
  const canCancelReservation = (reservation) => {
    const reservationEnd = getReservationEndDateTime(reservation);

    return Boolean(
      reservationEnd &&
      reservationEnd >= new Date() &&
      !isCancelledStatus(reservation.status),
    );
  };

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
