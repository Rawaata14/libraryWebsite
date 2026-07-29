/*
=========================================================
MyReservationsPage.jsx

תיאור הקובץ:
דף הצגת וניהול הזמנות המקומות של המשתמש המחובר.

הקובץ כולל:
- שליפת הזמנות המשתמש מהשרת.
- הפרדת הזמנות עתידיות מהיסטוריית ההזמנות.
- ביטול הזמנה עתידית.
- הצגת מצבי טעינה, שגיאה והצלחה.
=========================================================
*/

import { useEffect, useState } from "react";
import axios from "axios";
import PageShell from "../components/layout/PageShell";
import PageBanner from "../components/layout/PageBanner";
import "../styles/my-reservations.css";

/*
---------------------------------------------------------
formatReservationDate

תפקיד:
ממיר את התאריך שמתקבל ממסד הנתונים
לפורמט קריא של יום, חודש ושנה.
---------------------------------------------------------
*/
const formatReservationDate = (dateValue) => {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

/*
---------------------------------------------------------
formatReservationTime

תפקיד:
מקצר את ערך השעה לפורמט HH:MM.
---------------------------------------------------------
*/
const formatReservationTime = (timeValue) => {
  if (!timeValue) {
    return "-";
  }

  return String(timeValue).substring(0, 5);
};

/*
---------------------------------------------------------
getReservationStatusLabel

תפקיד:
מחזיר טקסט ידידותי להצגת סטטוס ההזמנה.
---------------------------------------------------------
*/
const getReservationStatusLabel = (status) => {
  switch (status?.toLowerCase()) {
    case "occupied":
    case "confirmed":
      return "Confirmed";

    case "pending":
      return "Pending";

    case "cancelled":
    case "canceled":
      return "Cancelled";

    case "completed":
      return "Completed";

    default:
      return status || "Unknown";
  }
};

/*
---------------------------------------------------------
getReservationStatusClass

תפקיד:
מחזיר מחלקת CSS לפי סטטוס ההזמנה.
---------------------------------------------------------
*/
const getReservationStatusClass = (status) => {
  switch (status?.toLowerCase()) {
    case "occupied":
    case "confirmed":
      return "confirmed";

    case "pending":
      return "pending";

    case "cancelled":
    case "canceled":
      return "cancelled";

    case "completed":
      return "completed";

    default:
      return "default";
  }
};

/*
---------------------------------------------------------
getReservationEndDateTime

תפקיד:
יוצר תאריך ושעת סיום מלאים של ההזמנה.

הערך משמש לקביעה אם ההזמנה עתידית
או שייכת להיסטוריה.
---------------------------------------------------------
*/
const getReservationEndDateTime = (reservation) => {
  if (!reservation.reservationDate || !reservation.endTime) {
    return null;
  }

  const reservationDate = new Date(reservation.reservationDate);

  if (Number.isNaN(reservationDate.getTime())) {
    return null;
  }

  const year = reservationDate.getFullYear();
  const month = String(reservationDate.getMonth() + 1).padStart(2, "0");
  const day = String(reservationDate.getDate()).padStart(2, "0");
  const formattedTime = String(reservation.endTime).substring(0, 8);

  const reservationEndDateTime = new Date(
    `${year}-${month}-${day}T${formattedTime}`,
  );

  if (Number.isNaN(reservationEndDateTime.getTime())) {
    return null;
  }

  return reservationEndDateTime;
};

/*
---------------------------------------------------------
isReservationCancelled

תפקיד:
בודקת אם ההזמנה כבר בוטלה.
---------------------------------------------------------
*/
const isReservationCancelled = (reservation) => {
  const normalizedStatus = reservation.status?.toLowerCase();

  return ["cancelled", "canceled"].includes(normalizedStatus);
};

/*
---------------------------------------------------------
MyReservationsPage

תפקיד:
מציג למשתמש המחובר את הזמנות המקומות שלו
ומאפשר לבטל הזמנה עתידית.
---------------------------------------------------------
*/
export default function MyReservationsPage() {
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
  שולפת מהשרת את ההזמנות של המשתמש המחובר.

  השרת מזהה את המשתמש דרך ה-session,
  ולכן ה-Frontend אינו שולח userId.
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
      console.error("Error fetching reservations:", error);

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
  };

  /*
  ---------------------------------------------------------
  handleCancelReservation

  תפקיד:
  שולחת בקשה לשרת לביטול ההזמנה שנבחרה.

  לאחר הצלחה:
  - סטטוס ההזמנה מתעדכן מקומית.
  - ההזמנה עוברת אוטומטית להיסטוריה.
  - מוצגת הודעת הצלחה.
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

      const response = await axios.patch(
        `http://localhost:8000/reservations/${reservationId}/cancel`,
        {},
        {
          withCredentials: true,
        },
      );

      /*
        עדכון ה-state המקומי מונע צורך
        בטעינה מחדש של כל הדף.
      */
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
        response.data.message || "Reservation cancelled successfully.",
      );
    

  /*
  ---------------------------------------------------------
  useEffect

  תפקיד:
  שולף את ההזמנות פעם אחת בעת טעינת העמוד.
  ---------------------------------------------------------
  */
  useEffect(() => {
    fetchReservations();
  }, []);

  const now = new Date();

  /*
    הזמנות עתידיות:
    זמן הסיום שלהן עדיין לא עבר
    והן אינן מבוטלות.
  */
  const upcomingReservations = reservations
    .filter((reservation) => {
      const reservationEnd = getReservationEndDateTime(reservation);

      return (
        reservationEnd &&
        reservationEnd >= now &&
        !isReservationCancelled(reservation)
      );
    })
    .sort((firstReservation, secondReservation) => {
      const firstDate = getReservationEndDateTime(firstReservation);
      const secondDate = getReservationEndDateTime(secondReservation);

      return firstDate - secondDate;
    });

  /*
    היסטוריית הזמנות:
    הזמנות שכבר הסתיימו או בוטלו.
  */
  const pastReservations = reservations
    .filter((reservation) => {
      const reservationEnd = getReservationEndDateTime(reservation);

      return (
        !reservationEnd ||
        reservationEnd < now ||
        isReservationCancelled(reservation)
      );
    })
    .sort((firstReservation, secondReservation) => {
      const firstDate = getReservationEndDateTime(firstReservation);
      const secondDate = getReservationEndDateTime(secondReservation);

      return (secondDate?.getTime() || 0) - (firstDate?.getTime() || 0);
    });

  const displayedReservations =
    selectedFilter === "upcoming"
      ? upcomingReservations
      : selectedFilter === "past"
        ? pastReservations
        : reservations;

  return (
    <PageShell>
      <PageBanner title="My Reservations" />

      <main className="myReservationsPage">
        <section className="myReservationsCard">
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

          {successMessage && (
            <div className="reservationFeedback successFeedback">
              <span>✓</span>

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

          {errorMessage && !isLoading && (
            <div className="reservationFeedback errorFeedback">
              <span>!</span>

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

          <div className="reservationSummaryGrid">
            <div className="reservationSummaryCard">
              <span>📅</span>

              <div>
                <strong>{upcomingReservations.length}</strong>
                <p>Upcoming Reservations</p>
              </div>
            </div>

            <div className="reservationSummaryCard">
              <span>🕘</span>

              <div>
                <strong>{pastReservations.length}</strong>
                <p>Previous Reservations</p>
              </div>
            </div>

            <div className="reservationSummaryCard">
              <span>🪑</span>

              <div>
                <strong>{reservations.length}</strong>
                <p>Total Reservations</p>
              </div>
            </div>
          </div>

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

          {isLoading ? (
            <div className="reservationsMessage">
              <span className="reservationsLoadingIcon">⌛</span>
              <p>Loading reservations...</p>
            </div>
          ) : displayedReservations.length === 0 ? (
            <div className="reservationsMessage">
              <span>📭</span>

              <h3>No reservations found</h3>

              <p>
                {selectedFilter === "upcoming"
                  ? "You do not have any upcoming reservations."
                  : selectedFilter === "past"
                    ? "You do not have previous reservations."
                    : "You have not created any reservations yet."}
              </p>
            </div>
          ) : (
            <div className="myReservationsList">
              {displayedReservations.map((reservation) => {
                const reservationEnd = getReservationEndDateTime(reservation);

                const canCancel =
                  reservationEnd &&
                  reservationEnd >= now &&
                  !isReservationCancelled(reservation);

                const isCancelling =
                  cancellingReservationId === reservation.reservationId;

                return (
                  <article
                    key={reservation.reservationId}
                    className="myReservationItem"
                  >
                    <div className="reservationSeatIcon">🪑</div>

                    <div className="reservationMainDetails">
                      <h3>Seat {reservation.seatId}</h3>

                      <div className="reservationDetailsGrid">
                        <p>
                          <span>Date</span>

                          <strong>
                            {formatReservationDate(reservation.reservationDate)}
                          </strong>
                        </p>

                        <p>
                          <span>Time</span>

                          <strong>
                            {formatReservationTime(reservation.startTime)} -{" "}
                            {formatReservationTime(reservation.endTime)}
                          </strong>
                        </p>

                        <p>
                          <span>Reservation ID</span>

                          <strong>#{reservation.reservationId}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="reservationActionsColumn">
                      <span
                        className={`myReservationStatus ${getReservationStatusClass(
                          reservation.status,
                        )}`}
                      >
                        {getReservationStatusLabel(reservation.status)}
                      </span>

                      {canCancel && (
                        <button
                          type="button"
                          className="cancelReservationButton"
                          disabled={isCancelling}
                          onClick={() =>
                            handleCancelReservation(reservation.reservationId)
                          }
                        >
                          {isCancelling
                            ? "Cancelling..."
                            : "Cancel Reservation"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </PageShell>
  );
}
