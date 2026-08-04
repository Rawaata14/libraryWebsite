/*
=========================================================
ManageReservationsPage.jsx

תיאור הקובץ:
דף ניהול הזמנות המקומות עבור הספרן.

הקובץ כולל:
- שליפת כל ההזמנות מהשרת.
- חיפוש לפי משתמש, אימייל או מספר כיסא.
- סינון לפי סטטוס.
- הצגת פרטי ההזמנה והמשתמש.
- ביטול הזמנה במקרה חריג על ידי הספרן.
- שליחת סיבת הביטול למשתמש באמצעות התראה.
=========================================================
*/

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import PageShell from "../components/layout/PageShell";
import PageBanner from "../components/layout/PageBanner";
import "../styles/manage-reservations.css";

/*
---------------------------------------------------------
formatReservationDate

תפקיד:
ממירה תאריך שמתקבל מהשרת לפורמט קריא:
DD/MM/YYYY.
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
מקצרת שעה שמתקבלת מהמסד לפורמט HH:MM.
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
getStatusLabel

תפקיד:
מחזירה כיתוב ידידותי עבור סטטוס ההזמנה.
---------------------------------------------------------
*/
const getStatusLabel = (status) => {
  switch (status?.toLowerCase()) {
    case "occupied":
    case "confirmed":
      return "Confirmed";

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
getStatusClass

תפקיד:
מחזירה מחלקת CSS מתאימה לפי סטטוס ההזמנה.
---------------------------------------------------------
*/
const getStatusClass = (status) => {
  switch (status?.toLowerCase()) {
    case "occupied":
    case "confirmed":
      return "confirmed";

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
formatLocation

תפקיד:
ממירה את שם האזור מתוך מסד הנתונים לכיתוב קריא.
---------------------------------------------------------
*/
const formatLocation = (location) => {
  if (!location) {
    return "-";
  }

  return location
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/*
---------------------------------------------------------
isCancelledStatus

תפקיד:
בודקת אם ההזמנה כבר בוטלה.
---------------------------------------------------------
*/
const isCancelledStatus = (status) => {
  return ["cancelled", "canceled"].includes(status?.toLowerCase());
};

/*
---------------------------------------------------------
ManageReservationsPage

תפקיד:
מציג לספרן את כל הזמנות המקומות ומאפשר
לבטל הזמנה במקרה חריג.
---------------------------------------------------------
*/
export default function ManageReservationsPage() {
  const [reservations, setReservations] = useState([]);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [selectedReservation, setSelectedReservation] = useState(null);

  const [cancellationReason, setCancellationReason] = useState("");

  const [isCancelling, setIsCancelling] = useState(false);

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
  פותחת חלון ביטול עבור ההזמנה שנבחרה.
  ---------------------------------------------------------
  */
  const openCancellationDialog = (reservation) => {
    setSelectedReservation(reservation);
    setCancellationReason("");
    setErrorMessage("");
    setSuccessMessage("");
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

  הביטול מתבצע רק לאחר הזנת סיבה.
  לאחר ההצלחה מתעדכן ה-state המקומי ללא רענון הדף.
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
      setErrorMessage("");
      setSuccessMessage("");

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
        עדכון מקומי של ההזמנה מונע צורך
        לטעון מחדש את כל רשימת ההזמנות.
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
  useEffect

  תפקיד:
  טוען את ההזמנות פעם אחת כאשר הדף נפתח.
  ---------------------------------------------------------
  */
  useEffect(() => {
    fetchReservations();
  }, []);

  /*
  ---------------------------------------------------------
  filteredReservations

  תפקיד:
  מסנן את רשימת ההזמנות לפי טקסט החיפוש
  ולפי הסטטוס שנבחר.

  useMemo מונע חישוב מחדש כאשר הנתונים
  הרלוונטיים לא השתנו.
  ---------------------------------------------------------
  */
  const filteredReservations = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return reservations.filter((reservation) => {
      const matchesStatus =
        statusFilter === "all" ||
        reservation.status?.toLowerCase() === statusFilter;

      const searchableValues = [
        reservation.fullName,
        reservation.email,
        reservation.seatId,
        reservation.location,
        reservation.reservationId,
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableValues.includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [reservations, searchText, statusFilter]);

  const activeReservationsCount = reservations.filter((reservation) =>
    ["occupied", "confirmed"].includes(reservation.status?.toLowerCase()),
  ).length;

  const cancelledReservationsCount = reservations.filter((reservation) =>
    isCancelledStatus(reservation.status),
  ).length;

  return (
    <PageShell>
      <PageBanner title="Manage Reservations" />

      <main className="manageReservationsPage">
        <section className="manageReservationsCard">
          <div className="manageReservationsHeader">
            <div>
              <h2>Seat Reservations Management</h2>

              <p>View all reservations and handle exceptional cancellations.</p>
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

          {successMessage && (
            <div className="managementFeedback successFeedback">
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

          {errorMessage && (
            <div className="managementFeedback errorFeedback">
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

          <div className="managementSummaryGrid">
            <div className="managementSummaryCard">
              <span>📅</span>

              <div>
                <strong>{reservations.length}</strong>
                <p>Total Reservations</p>
              </div>
            </div>

            <div className="managementSummaryCard">
              <span>✅</span>

              <div>
                <strong>{activeReservationsCount}</strong>
                <p>Active Reservations</p>
              </div>
            </div>

            <div className="managementSummaryCard">
              <span>❌</span>

              <div>
                <strong>{cancelledReservationsCount}</strong>
                <p>Cancelled Reservations</p>
              </div>
            </div>
          </div>

          <div className="managementFilters">
            <input
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search by name, email, seat or reservation ID..."
              aria-label="Search reservations"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter reservations by status"
            >
              <option value="all">All Statuses</option>
              <option value="occupied">Confirmed</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {isLoading ? (
            <div className="managementEmptyState">
              <span>⌛</span>
              <p>Loading reservations...</p>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="managementEmptyState">
              <span>📭</span>
              <h3>No reservations found</h3>
              <p>No reservations match the selected filters.</p>
            </div>
          ) : (
            <div className="reservationsTableWrapper">
              <table className="reservationsManagementTable">
                <thead>
                  <tr>
                    <th>Reservation</th>
                    <th>User</th>
                    <th>Seat</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredReservations.map((reservation) => (
                    <tr key={reservation.reservationId}>
                      <td>
                        <strong>#{reservation.reservationId}</strong>
                      </td>

                      <td>
                        <div className="reservationUserDetails">
                          <strong>
                            {reservation.fullName || "Unknown User"}
                          </strong>

                          <span>{reservation.email || "-"}</span>
                        </div>
                      </td>

                      <td>
                        <div className="reservationSeatDetails">
                          <strong>Seat {reservation.seatId}</strong>

                          <span>{formatLocation(reservation.location)}</span>
                        </div>
                      </td>

                      <td>
                        {formatReservationDate(reservation.reservationDate)}
                      </td>

                      <td>
                        {formatReservationTime(reservation.startTime)} -{" "}
                        {formatReservationTime(reservation.endTime)}
                      </td>

                      <td>
                        <span
                          className={`managementStatus ${getStatusClass(
                            reservation.status,
                          )}`}
                        >
                          {getStatusLabel(reservation.status)}
                        </span>
                      </td>

                      <td>
                        {!isCancelledStatus(reservation.status) ? (
                          <button
                            type="button"
                            className="librarianCancelButton"
                            onClick={() => openCancellationDialog(reservation)}
                          >
                            Cancel
                          </button>
                        ) : (
                          <span className="noActionText">No action</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {selectedReservation && (
        <div
          className="cancellationModalOverlay"
          role="presentation"
          onMouseDown={closeCancellationDialog}
        >
          <section
            className="cancellationModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancellation-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="cancellationModalHeader">
              <div>
                <h2 id="cancellation-modal-title">Cancel Reservation</h2>

                <p>Reservation #{selectedReservation.reservationId}</p>
              </div>

              <button
                type="button"
                className="closeCancellationModalButton"
                onClick={closeCancellationDialog}
                disabled={isCancelling}
                aria-label="Close cancellation window"
              >
                ×
              </button>
            </div>

            <div className="cancellationReservationInfo">
              <p>
                <span>User</span>
                <strong>
                  {selectedReservation.fullName || "Unknown User"}
                </strong>
              </p>

              <p>
                <span>Seat</span>
                <strong>Seat {selectedReservation.seatId}</strong>
              </p>

              <p>
                <span>Date</span>
                <strong>
                  {formatReservationDate(selectedReservation.reservationDate)}
                </strong>
              </p>

              <p>
                <span>Time</span>
                <strong>
                  {formatReservationTime(selectedReservation.startTime)} -{" "}
                  {formatReservationTime(selectedReservation.endTime)}
                </strong>
              </p>
            </div>

            <label
              className="cancellationReasonField"
              htmlFor="cancellation-reason"
            >
              <span>Cancellation reason</span>

              <textarea
                id="cancellation-reason"
                value={cancellationReason}
                onChange={(event) => setCancellationReason(event.target.value)}
                placeholder="Explain why the reservation must be cancelled..."
                maxLength={300}
                rows={5}
                disabled={isCancelling}
              />

              <small>{cancellationReason.length}/300 characters</small>
            </label>

            <p className="cancellationWarning">
              The user will receive a notification containing this reason.
            </p>

            <div className="cancellationModalActions">
              <button
                type="button"
                className="keepReservationButton"
                onClick={closeCancellationDialog}
                disabled={isCancelling}
              >
                Keep Reservation
              </button>

              <button
                type="button"
                className="confirmCancellationButton"
                onClick={handleLibrarianCancellation}
                disabled={isCancelling || !cancellationReason.trim()}
              >
                {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </section>
        </div>
      )}
    </PageShell>
  );
}
