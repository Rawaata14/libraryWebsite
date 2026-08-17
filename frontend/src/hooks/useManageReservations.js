/*
=========================================================
useManageReservations.js

תיאור הקובץ:
Custom Hook המרכז את מצב ולוגיקת דף ניהול ההזמנות.

ה-Hook אחראי על:
- טעינת ההזמנות.
- חיפוש וסינון.
- ביטול הזמנה על ידי ספרן.
- שליחת הודעה לבעל הזמנה.
- ניהול הודעות הצלחה ושגיאה.
=========================================================
*/

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  cancelReservationByLibrarian,
  getReservations,
  sendReservationMessage,
} from "../services/reservationService";

import {
  countActiveReservations,
  countCancelledReservations,
  filterReservations,
  countTodayReservations,
} from "../utils/reservationUtils";

/*
---------------------------------------------------------
useManageReservations

תפקיד:
מספק לדף ניהול ההזמנות את הנתונים והפעולות
הדרושים להצגת ההזמנות ולניהולן.
---------------------------------------------------------
*/
export default function useManageReservations() {
  const [reservations, setReservations] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [selectedReservation, setSelectedReservation] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const [messageReservation, setMessageReservation] = useState(null);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  /*
  ---------------------------------------------------------
  clearFeedbackMessages

  תפקיד:
  מנקה הודעות קודמות לפני התחלת פעולה חדשה.
  ---------------------------------------------------------
  */
  const clearFeedbackMessages = useCallback(() => {
    setErrorMessage("");
    setSuccessMessage("");
  }, []);

  /*
  ---------------------------------------------------------
  fetchReservations

  תפקיד:
  טוענת את ההזמנות שהמשתמש המחובר מורשה לראות.
  ---------------------------------------------------------
  */
  const fetchReservations = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await getReservations();

      setReservations(response.data.reservations || []);
    } catch (error) {
      console.error("Error fetching reservations for librarian:", error);

      if (error.response?.status === 401) {
        setErrorMessage("You must be logged in to view reservations.");
      } else if (error.response?.status === 403) {
        setErrorMessage("Only librarians can access this page.");
      } else {
        setErrorMessage(
          error.response?.data?.message ||
            "An error occurred while loading reservations.",
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
  openCancellationDialog

  תפקיד:
  פותחת את חלון הביטול עבור ההזמנה שנבחרה.
  ---------------------------------------------------------
  */
  const openCancellationDialog = (reservation) => {
    setSelectedReservation(reservation);
    setCancellationReason("");
    clearFeedbackMessages();
  };

  /*
  ---------------------------------------------------------
  closeCancellationDialog

  תפקיד:
  סוגרת את חלון הביטול אם בקשת ביטול אינה מתבצעת.
  ---------------------------------------------------------
  */
  const closeCancellationDialog = () => {
    if (isCancelling) {
      return;
    }

    setSelectedReservation(null);
    setCancellationReason("");
  };

  /*
  ---------------------------------------------------------
  handleLibrarianCancellation

  תפקיד:
  מאמתת את סיבת הביטול, שולחת אותה לשרת
  ומעדכנת את ההזמנה ברשימה המקומית.
  ---------------------------------------------------------
  */
  const handleLibrarianCancellation = async () => {
    if (!selectedReservation) {
      return;
    }

    const trimmedReason = cancellationReason.trim();

    if (!trimmedReason) {
      setErrorMessage("A cancellation reason is required.");
      return;
    }

    try {
      setIsCancelling(true);
      clearFeedbackMessages();

      const response = await cancelReservationByLibrarian(
        selectedReservation.reservationId,
        trimmedReason,
      );

      setReservations((previousReservations) =>
        previousReservations.map((reservation) =>
          reservation.reservationId === selectedReservation.reservationId
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

      setSelectedReservation(null);
      setCancellationReason("");
    } catch (error) {
      console.error("Error cancelling reservation by librarian:", error);

      if (error.response?.status === 401) {
        setErrorMessage("Your session has expired. Please log in again.");
      } else if (error.response?.status === 403) {
        setErrorMessage("Only librarians can cancel this reservation.");
      } else if (error.response?.status === 404) {
        setErrorMessage(
          error.response?.data?.message || "Reservation not found.",
        );
      } else if (error.response?.status === 409) {
        setErrorMessage(
          error.response?.data?.message ||
            "The reservation is already cancelled.",
        );
      } else {
        setErrorMessage(
          error.response?.data?.message ||
            "An error occurred while cancelling the reservation.",
        );
      }
    } finally {
      setIsCancelling(false);
    }
  };

  /*
  ---------------------------------------------------------
  openMessageDialog

  תפקיד:
  פותחת את חלון ההודעה עבור ההזמנה שנבחרה.
  ---------------------------------------------------------
  */
  const openMessageDialog = (reservation) => {
    setMessageReservation(reservation);
    setMessageSubject("");
    setMessageContent("");
    clearFeedbackMessages();
  };

  /*
  ---------------------------------------------------------
  closeMessageDialog

  תפקיד:
  סוגרת את חלון ההודעה אם השליחה אינה מתבצעת.
  ---------------------------------------------------------
  */
  const closeMessageDialog = () => {
    if (isSendingMessage) {
      return;
    }

    setMessageReservation(null);
    setMessageSubject("");
    setMessageContent("");
  };

  /*
  ---------------------------------------------------------
  handleSendReservationMessage

  תפקיד:
  מאמתת את תוכן ההודעה ושולחת אותה לבעל ההזמנה.
  ---------------------------------------------------------
  */
  const handleSendReservationMessage = async () => {
    if (!messageReservation) {
      return;
    }

    const trimmedSubject = messageSubject.trim();
    const trimmedMessage = messageContent.trim();

    if (!trimmedSubject) {
      setErrorMessage("Message subject is required.");
      return;
    }

    if (!trimmedMessage) {
      setErrorMessage("Message content is required.");
      return;
    }

    try {
      setIsSendingMessage(true);
      clearFeedbackMessages();

      const response = await sendReservationMessage(
        messageReservation.reservationId,
        trimmedSubject,
        trimmedMessage,
      );

      setSuccessMessage(response.data?.message || "Message sent successfully.");

      setMessageReservation(null);
      setMessageSubject("");
      setMessageContent("");
    } catch (error) {
      console.error("Error sending reservation message:", error);

      if (error.response?.status === 401) {
        setErrorMessage("Your session has expired. Please log in again.");
      } else if (error.response?.status === 403) {
        setErrorMessage("Only librarians can send this message.");
      } else if (error.response?.status === 404) {
        setErrorMessage(
          error.response?.data?.message || "Reservation not found.",
        );
      } else {
        setErrorMessage(
          error.response?.data?.message ||
            "An error occurred while sending the message.",
        );
      }
    } finally {
      setIsSendingMessage(false);
    }
  };

  const filteredReservations = useMemo(
    () => filterReservations(reservations, searchText, statusFilter),
    [reservations, searchText, statusFilter],
  );

  const activeReservationsCount = countActiveReservations(reservations);

  const cancelledReservationsCount = countCancelledReservations(reservations);

  const todayReservationsCount = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return countTodayReservations(reservations, todayStr);
  }, [reservations]);

  return {
    reservations,
    filteredReservations,
    searchText,
    setSearchText,
    statusFilter,
    setStatusFilter,
    isLoading,
    errorMessage,
    clearErrorMessage: () => setErrorMessage(""),
    successMessage,
    clearSuccessMessage: () => setSuccessMessage(""),
    selectedReservation,
    cancellationReason,
    setCancellationReason,
    isCancelling,
    openCancellationDialog,
    closeCancellationDialog,
    handleLibrarianCancellation,
    messageReservation,
    messageSubject,
    setMessageSubject,
    messageContent,
    setMessageContent,
    isSendingMessage,
    openMessageDialog,
    closeMessageDialog,
    handleSendReservationMessage,
    fetchReservations,
    activeReservationsCount,
    cancelledReservationsCount,
    todayReservationsCount,
  };
}
