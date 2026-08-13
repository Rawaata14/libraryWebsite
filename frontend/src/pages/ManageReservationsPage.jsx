/*
=========================================================
ManageReservationsPage.jsx

תיאור הקובץ:
דף ניהול הזמנות המקומות עבור הספרן.

הקובץ אחראי על:
- שליפת כל ההזמנות מהשרת.
- ניהול החיפוש והסינון.
- ביטול הזמנה במקרה חריג.
- שליחת הודעה למשתמש מתוך ההזמנה.
- העברת הנתונים לקומפוננטות התצוגה.

רכיבי התצוגה נמצאים בתיקייה:
components/reservations
=========================================================
*/

import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import PageShell from "../components/layout/PageShell";
import PageBanner from "../components/layout/PageBanner";

import ReservationSummary from "../components/reservations/ReservationSummary";
import ReservationFilters from "../components/reservations/ReservationFilters";
import ReservationsTable from "../components/reservations/ReservationsTable";
import CancellationModal from "../components/reservations/CancellationModal";
import ReservationMessageModal from "../components/reservations/ReservationMessageModal";

import {
  filterReservations,
  countActiveReservations,
  countCancelledReservations,
} from "../utils/reservationUtils";

import "../styles/manage-reservations.css";

/*
---------------------------------------------------------
ManageReservationsPage

תפקיד:
מנהלת את נתוני עמוד ההזמנות של הספרן
ומחברת בין השרת לבין קומפוננטות התצוגה.
---------------------------------------------------------
*/
export default function ManageReservationsPage() {
  /*
  =========================================================
  נתוני ההזמנות והסינון
  =========================================================
  */

  const [reservations, setReservations] = useState([]);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  /*
  =========================================================
  מצבי טעינה ומשוב
  =========================================================
  */

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /*
  =========================================================
  נתוני חלון ביטול הזמנה
  =========================================================
  */

  const [selectedReservation, setSelectedReservation] = useState(null);

  const [cancellationReason, setCancellationReason] = useState("");

  const [isCancelling, setIsCancelling] = useState(false);

  /*
  =========================================================
  נתוני חלון שליחת הודעה
  =========================================================
  */

  const [messageReservation, setMessageReservation] = useState(null);

  const [messageSubject, setMessageSubject] = useState("");

  const [messageContent, setMessageContent] = useState("");

  const [isSendingMessage, setIsSendingMessage] = useState(false);

  /*
  ---------------------------------------------------------
  clearFeedbackMessages

  תפקיד:
  מנקה הודעות הצלחה ושגיאה לפני התחלת פעולה חדשה.
  ---------------------------------------------------------
  */
  const clearFeedbackMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  /*
  ---------------------------------------------------------
  fetchReservations

  תפקיד:
  שולפת מהשרת את כל ההזמנות.

  השרת בודק את ה-session ואת תפקיד המשתמש.
  ספרן מקבל את כל ההזמנות במערכת.
  ---------------------------------------------------------
  */
  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await axios.get(
        "http://localhost:8000/reservations/get-reservations",
        {
          withCredentials: true,
        },
      );

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
  };

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
  סוגרת את חלון הביטול ומנקה את הנתונים הזמניים.
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
  שולחת בקשת ביטול לשרת עבור ההזמנה שנבחרה.

  לאחר הצלחה:
  - סטטוס ההזמנה מתעדכן ב-state.
  - המשתמש מקבל התראה דרך ה-Backend.
  - חלון הביטול נסגר.
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

      const response = await axios.patch(
        `http://localhost:8000/reservations/${selectedReservation.reservationId}/librarian-cancel`,
        {
          reason: trimmedReason,
        },
        {
          withCredentials: true,
        },
      );

      /*
        עדכון מקומי של הרשימה מונע צורך
        בשליפה מחדש של כל ההזמנות.
      */
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
  פותחת חלון לשליחת הודעה למשתמש
  שביצע את ההזמנה שנבחרה.
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
  סוגרת את חלון שליחת ההודעה
  ומנקה את הנתונים הזמניים.
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
  שולחת בקשה לשרת ליצירת התראה פנימית
  עבור בעל ההזמנה.

  השרת מאתר את המשתמש לפי reservationId,
  ולכן אין צורך לשלוח userId מה-Frontend.
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

      const response = await axios.post(
        `http://localhost:8000/reservations/${messageReservation.reservationId}/message`,
        {
          subject: trimmedSubject,
          message: trimmedMessage,
        },
        {
          withCredentials: true,
        },
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

  /*
  ---------------------------------------------------------
  טעינת נתוני ההזמנות

  מתבצעת פעם אחת כאשר העמוד נטען.
  ---------------------------------------------------------
  */
  useEffect(() => {
    fetchReservations();
  }, []);

  /*
  ---------------------------------------------------------
  filteredReservations

  סינון הרשימה מתבצע דרך reservationUtils
  כדי להשאיר את העמוד הראשי נקי מלוגיקת תצוגה.
  ---------------------------------------------------------
  */
  const filteredReservations = useMemo(
    () => filterReservations(reservations, searchText, statusFilter),
    [reservations, searchText, statusFilter],
  );

  /*
  =========================================================
  חישובי סיכום
  =========================================================
  */

  const activeReservationsCount = countActiveReservations(reservations);

  const cancelledReservationsCount = countCancelledReservations(reservations);

  return (
    <PageShell>
      <PageBanner title="Manage Reservations" />

      <main className="manageReservationsPage">
        <section className="manageReservationsCard">
          {/*
          =================================================
          כותרת הדף
          =================================================
          */}

          <div className="manageReservationsHeader">
            <div>
              <h2>Seat Reservations Management</h2>

              <p>
                View all reservations, send messages and handle exceptional
                cancellations.
              </p>
            </div>

            <button
              type="button"
              className="refreshManagementButton"
              onClick={fetchReservations}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {/*
          =================================================
          הודעות הצלחה ושגיאה
          =================================================
          */}

          {successMessage && (
            <div className="managementFeedback successFeedback">
              <span aria-hidden="true">✓</span>

              <p>{successMessage}</p>

              <button
                type="button"
                aria-label="Close success message"
                onClick={() => setSuccessMessage("")}
              >
                ×
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="managementFeedback errorFeedback">
              <span aria-hidden="true">!</span>

              <p>{errorMessage}</p>

              <button
                type="button"
                aria-label="Close error message"
                onClick={() => setErrorMessage("")}
              >
                ×
              </button>
            </div>
          )}

          {/*
          =================================================
          נתוני סיכום
          =================================================
          */}

          <ReservationSummary
            totalReservations={reservations.length}
            activeReservations={activeReservationsCount}
            cancelledReservations={cancelledReservationsCount}
          />

          {/*
          =================================================
          חיפוש וסינון
          =================================================
          */}

          <ReservationFilters
            searchText={searchText}
            statusFilter={statusFilter}
            onSearchChange={setSearchText}
            onStatusChange={setStatusFilter}
          />

          {/*
          =================================================
          טבלת הזמנות
          =================================================
          */}

          <ReservationsTable
            reservations={filteredReservations}
            isLoading={isLoading}
            onCancel={openCancellationDialog}
            onSendMessage={openMessageDialog}
          />
        </section>
      </main>

      {/*
      =====================================================
      חלון ביטול הזמנה
      =====================================================
      */}

      <CancellationModal
        reservation={selectedReservation}
        cancellationReason={cancellationReason}
        isCancelling={isCancelling}
        onReasonChange={setCancellationReason}
        onClose={closeCancellationDialog}
        onConfirm={handleLibrarianCancellation}
      />

      {/*
      =====================================================
      חלון שליחת הודעה
      =====================================================
      */}

      <ReservationMessageModal
        reservation={messageReservation}
        subject={messageSubject}
        message={messageContent}
        isSending={isSendingMessage}
        onSubjectChange={setMessageSubject}
        onMessageChange={setMessageContent}
        onClose={closeMessageDialog}
        onSend={handleSendReservationMessage}
      />
    </PageShell>
  );
}
