/*
=========================================================
MyReservationsPage.jsx

תיאור הקובץ:
דף הצגת הזמנות המקומות של המשתמש המחובר.

העמוד אחראי על:
- הצגת סיכום ההזמנות.
- מעבר בין הזמנות עתידיות, היסטוריה וכל ההזמנות.
- הצגת רשימת ההזמנות.
- חיבור התצוגה ל-useMyReservations.
=========================================================
*/

import PageShell from "../components/layout/PageShell";
import PageBanner from "../components/layout/PageBanner";
import MyReservationItem from "../components/reservations/MyReservationItem";

import useMyReservations from "../hooks/useMyReservations";

import "../styles/my-reservations.css";

/*
---------------------------------------------------------
getEmptyReservationsMessage

תפקיד:
מחזירה הודעה מתאימה כאשר אין הזמנות
בסינון שנבחר.
---------------------------------------------------------
*/
const getEmptyReservationsMessage = (selectedFilter) => {
  if (selectedFilter === "upcoming") {
    return "You do not have any upcoming reservations.";
  }

  if (selectedFilter === "past") {
    return "You do not have previous reservations.";
  }

  return "You have not created any reservations yet.";
};

/*
---------------------------------------------------------
MyReservationsPage

תפקיד:
מחברת בין לוגיקת הזמנות המשתמש שב-Hook
לבין רכיבי התצוגה של העמוד.
---------------------------------------------------------
*/
export default function MyReservationsPage() {
  const {
    reservations,
    upcomingReservations,
    pastReservations,
    displayedReservations,
    selectedFilter,
    setSelectedFilter,
    isLoading,
    cancellingReservationId,
    errorMessage,
    clearErrorMessage,
    successMessage,
    clearSuccessMessage,
    fetchReservations,
    handleCancelReservation,
    canCancelReservation,
  } = useMyReservations();

  return (
    <PageShell>
      <PageBanner title="My Reservations" />

      <main className="myReservationsPage">
        <section className="myReservationsCard">
          {/*
          =================================================
          כותרת ורענון
          =================================================
          */}

          <div className="myReservationsHeader">
            <div>
              <h2>My Seat Reservations</h2>

              <p>
                View your upcoming reservations and previous reservation
                history.
              </p>
            </div>

            <button
              type="button"
              className="refreshReservationsButton"
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
            <div className="reservationFeedback successFeedback">
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

          {errorMessage && !isLoading && (
            <div className="reservationFeedback errorFeedback">
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

          <div className="reservationSummaryGrid">
            <div className="reservationSummaryCard">
              <span aria-hidden="true">📅</span>

              <div>
                <strong>{upcomingReservations.length}</strong>
                <p>Upcoming Reservations</p>
              </div>
            </div>

            <div className="reservationSummaryCard">
              <span aria-hidden="true">🕘</span>

              <div>
                <strong>{pastReservations.length}</strong>
                <p>Previous Reservations</p>
              </div>
            </div>

            <div className="reservationSummaryCard">
              <span aria-hidden="true">🪑</span>

              <div>
                <strong>{reservations.length}</strong>
                <p>Total Reservations</p>
              </div>
            </div>
          </div>

          {/*
          =================================================
          סינון לפי תקופה
          =================================================
          */}

          <div className="reservationFilters">
            <button
              type="button"
              className={
                selectedFilter === "upcoming"
                  ? "reservationFilterButton active"
                  : "reservationFilterButton"
              }
              onClick={() => setSelectedFilter("upcoming")}
            >
              Upcoming
            </button>

            <button
              type="button"
              className={
                selectedFilter === "past"
                  ? "reservationFilterButton active"
                  : "reservationFilterButton"
              }
              onClick={() => setSelectedFilter("past")}
            >
              History
            </button>

            <button
              type="button"
              className={
                selectedFilter === "all"
                  ? "reservationFilterButton active"
                  : "reservationFilterButton"
              }
              onClick={() => setSelectedFilter("all")}
            >
              All
            </button>
          </div>

          {/*
          =================================================
          רשימת ההזמנות
          =================================================
          */}

          {isLoading ? (
            <div className="reservationsMessage">
              <span className="reservationsLoadingIcon" aria-hidden="true">
                ⌛
              </span>

              <p>Loading reservations...</p>
            </div>
          ) : displayedReservations.length === 0 ? (
            <div className="reservationsMessage">
              <span aria-hidden="true">📭</span>

              <h3>No reservations found</h3>

              <p>{getEmptyReservationsMessage(selectedFilter)}</p>
            </div>
          ) : (
            <div className="myReservationsList">
              {displayedReservations.map((reservation) => (
                <MyReservationItem
                  key={reservation.reservationId}
                  reservation={reservation}
                  canCancel={canCancelReservation(reservation)}
                  isCancelling={
                    cancellingReservationId === reservation.reservationId
                  }
                  onCancel={handleCancelReservation}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </PageShell>
  );
}
