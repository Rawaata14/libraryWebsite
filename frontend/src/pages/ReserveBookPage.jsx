/*
=========================================================
ReserveBookPage.jsx

תיאור הקובץ:
דף שריון ספר במסגרת הזמנת כיסא.

המשתמש:
- רואה את פרטי הספר.
- בוחר אחת מהזמנות הכיסא התקפות שלו.
- רואה את תאריך ושעות השימוש בספר.
- משריין את הספר לאותה הזמנה.
=========================================================
*/

import { useNavigate } from "react-router-dom";

import PageShell from "../components/layout/PageShell";
import PageBanner from "../components/layout/PageBanner";
import Button from "../components/common/Button";

import { useBookReservation } from "../hooks/useBookReservation";

import { buildApiUrl } from "../config/api";

import {
  formatLocation,
  formatReservationDate,
  formatReservationTime,
} from "../utils/reservationUtils";

/*
---------------------------------------------------------
getBookImageSource

תפקיד:
מחזירה את כתובת תמונת הספר.
---------------------------------------------------------
*/
function getBookImageSource(bookImageName) {
  if (!bookImageName) {
    return "/images/default-book.png";
  }

  if (bookImageName.startsWith("http")) {
    return bookImageName;
  }

  return buildApiUrl(`/uploads/${encodeURIComponent(bookImageName)}`);
}

/*
---------------------------------------------------------
ReserveBookPage

תפקיד:
מציג את תהליך שריון הספר.
---------------------------------------------------------
*/
export default function ReserveBookPage() {
  const navigate = useNavigate();

  const {
    book,
    user,
    eligibleReservations,
    selectedReservation,
    selectedReservationId,
    isPageLoading,
    isLoading,
    error,
    successMessage,
    handleReservationChange,
    handleReserveBook,
  } = useBookReservation();

  if (isPageLoading) {
    return (
      <PageShell>
        <PageBanner title="Reserve a Book" />

        <div className="reservePage">
          <div
            className="reserveContainer reserveLoading"
            role="status"
            aria-live="polite"
          >
            Loading reservation details...
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageBanner title="Reserve a Book" />

      <div className="reservePage">
        <div className="reserveContainer">
          {!book ? (
            <div className="reserveEmptyState">
              <h2>No Book Selected</h2>

              <p>
                Return to the books page and select a book before continuing.
              </p>

              <Button variant="primary" onClick={() => navigate("/books")}>
                Browse Books
              </Button>
            </div>
          ) : (
            <>
              {successMessage && (
                <div
                  className="reserveSuccess"
                  role="status"
                  aria-live="polite"
                >
                  {successMessage}
                </div>
              )}

              {error && (
                <div className="reserveError" role="alert">
                  {error}
                </div>
              )}

              <div className="reserveContent">
                <section
                  className="reserveBook"
                  aria-labelledby="selected-book-title"
                >
                  <img
                    src={getBookImageSource(book.book_image_name)}
                    alt={`Cover of ${book.title}`}
                  />

                  <h2 id="selected-book-title">{book.title}</h2>

                  <p>
                    <strong>Author:</strong> {book.author}
                  </p>

                  <p>
                    <strong>Available Copies:</strong> {book.available_quantity}
                  </p>
                </section>

                <section
                  className="reserveDetails"
                  aria-labelledby="reservation-details-title"
                >
                  <h2 id="reservation-details-title">
                    Seat Reservation Details
                  </h2>

                  <p>
                    <strong>User:</strong> {user?.fullName || user?.name || "-"}
                  </p>

                  <p>
                    <strong>Email:</strong> {user?.email || "-"}
                  </p>

                  {eligibleReservations.length === 0 ? (
                    <div className="reserveNoReservations">
                      <h3>A Seat Reservation Is Required</h3>

                      <p>
                        You must reserve a seat before reserving this book. The
                        book may only be used during your selected seat
                        reservation.
                      </p>

                      <Button
                        variant="primary"
                        onClick={() => navigate("/map")}
                      >
                        Reserve a Seat
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="reserveField">
                        <label htmlFor="seat-reservation">
                          Select Seat Reservation
                        </label>

                        <select
                          id="seat-reservation"
                          className="reserveReservationSelect"
                          value={selectedReservationId}
                          onChange={(event) =>
                            handleReservationChange(event.target.value)
                          }
                          disabled={isLoading || Boolean(successMessage)}
                        >
                          {eligibleReservations.map((reservation) => (
                            <option
                              key={reservation.reservationId}
                              value={reservation.reservationId}
                            >
                              Seat {reservation.seatId} —{" "}
                              {formatReservationDate(
                                reservation.reservationDate,
                              )}{" "}
                              — {formatReservationTime(reservation.startTime)}
                              {" - "}
                              {formatReservationTime(reservation.endTime)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedReservation && (
                        <div className="reserveSelectedReservation">
                          <h3>Selected Reservation</h3>

                          <dl>
                            <div>
                              <dt>Seat</dt>
                              <dd>{selectedReservation.seatId}</dd>
                            </div>

                            <div>
                              <dt>Area</dt>
                              <dd>
                                {formatLocation(selectedReservation.location)}
                              </dd>
                            </div>

                            <div>
                              <dt>Date</dt>
                              <dd>
                                {formatReservationDate(
                                  selectedReservation.reservationDate,
                                )}
                              </dd>
                            </div>

                            <div>
                              <dt>Book Collection</dt>
                              <dd>
                                {formatReservationTime(
                                  selectedReservation.startTime,
                                )}
                              </dd>
                            </div>

                            <div>
                              <dt>Book Return</dt>
                              <dd>
                                {formatReservationTime(
                                  selectedReservation.endTime,
                                )}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      )}

                      <div className="reserveNote">
                        The book must be collected and returned during the
                        selected seat reservation.
                      </div>

                      <div className="reserveActions">
                        <Button
                          variant="primary"
                          onClick={handleReserveBook}
                          disabled={
                            isLoading ||
                            Boolean(successMessage) ||
                            Number(book.available_quantity) <= 0
                          }
                        >
                          {isLoading
                            ? "Reserving..."
                            : successMessage
                              ? "Book Reserved"
                              : Number(book.available_quantity) <= 0
                                ? "Unavailable"
                                : "Reserve Book"}
                        </Button>
                      </div>
                    </>
                  )}
                </section>
              </div>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
