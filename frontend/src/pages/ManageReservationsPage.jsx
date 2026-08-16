/*
=========================================================
ManageReservationsPage.jsx

תיאור הקובץ:
דף התצוגה לניהול הזמנות המקומות עבור הספרן.

העמוד אחראי על:
- הצגת סיכום ההזמנות.
- הצגת חיפוש וסינון.
- הצגת טבלת ההזמנות.
- הצגת חלונות ביטול ושליחת הודעה.

מצב העמוד והלוגיקה מנוהלים באמצעות:
useManageReservations
=========================================================
*/

import { useNavigate } from "react-router-dom";

import PageShell from "../components/layout/PageShell";
import PageBanner from "../components/layout/PageBanner";

import ReservationSummary from "../components/reservations/ReservationSummary";
import ReservationFilters from "../components/reservations/ReservationFilters";
import ReservationsTable from "../components/reservations/ReservationsTable";
import CancellationModal from "../components/reservations/CancellationModal";
import ReservationMessageModal from "../components/reservations/ReservationMessageModal";

import useManageReservations from "../hooks/useManageReservations";

import "../styles/manage-reservations.css";

/*
---------------------------------------------------------
ManageReservationsPage

תפקיד:
מחברת בין לוגיקת ניהול ההזמנות שב-Hook
לבין רכיבי התצוגה של העמוד.
---------------------------------------------------------
*/
export default function ManageReservationsPage() {
  const navigate = useNavigate();

  const {
    reservations,
    filteredReservations,
    searchText,
    setSearchText,
    statusFilter,
    setStatusFilter,
    isLoading,
    errorMessage,
    clearErrorMessage,
    successMessage,
    clearSuccessMessage,
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
  } = useManageReservations();

  return (
    <PageShell>
      <PageBanner title="Manage Reservations" />
      <main className="manageReservationsPage">
        <button
          type="button"
          className="backButton1"
          onClick={() => navigate(-1)}
        >
          ←
        </button>
        <section className="manageReservationsCard">
          {/*
          =================================================
          כותרת ופעולת רענון
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
                onClick={clearSuccessMessage}
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
                onClick={clearErrorMessage}
              >
                ×
              </button>
            </div>
          )}

          {/*
          =================================================
          סיכום ההזמנות
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
          טבלת ההזמנות
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
