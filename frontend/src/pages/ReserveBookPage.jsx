/*
=========================================================
ReserveBookPage.jsx

תיאור הקובץ:
דף שריון ספר או הצטרפות לרשימת המתנה.

המשתמש:
- רואה את פרטי הספר.
- רואה אם הספר זמין.
- בוחר אחת מהזמנות המקום התקפות שלו.
- משריין ספר זמין לאותה הזמנה.
- מצטרף לרשימת המתנה אם אין עותק זמין.

הספר מיועד לשימוש בתוך הספרייה בלבד ולכן
נדרשת הזמנת מקום תקפה גם לצורך המתנה.
=========================================================
*/

import { useNavigate } from "react-router-dom";

import Button from "../components/common/Button";

import PageBanner from "../components/layout/PageBanner";

import PageShell from "../components/layout/PageShell";

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
מציגה את תהליך שריון הספר או ההצטרפות
לרשימת ההמתנה בהתאם לזמינות הספר.
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
    isBookAvailable,
    isPageLoading,
    isLoading,
    error,
    successMessage,
    handleReservationChange,
    handleReserveBook,
  } = useBookReservation();

  const pageTitle = isBookAvailable
    ? "Reserve a Book"
    : "Join Book Waiting List";

  /*
  ---------------------------------------------------------
  מצב טעינת הדף
  ---------------------------------------------------------
  */
  if (isPageLoading) {
    return (
      <PageShell>
        <PageBanner title="Book Reservation" />

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
      <PageBanner title={pageTitle} />

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

                  {!isBookAvailable && (
                    <div>
                      <Button
                        variant="secondary"
                        onClick={() => navigate("/my-waiting-lists")}
                      >
                        View My Waiting Lists
                      </Button>
                    </div>
                  )}
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

                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className={isBookAvailable ? "available" : "unavailable"}
                    >
                      {isBookAvailable ? "Available" : "Waiting List Available"}
                    </span>
                  </p>
                </section>

                <section
                  className="reserveDetails"
                  aria-labelledby="reservation-details-title"
                >
                  <h2 id="reservation-details-title">
                    {isBookAvailable
                      ? "Seat Reservation Details"
                      : "Select Your Library Visit"}
                  </h2>

                  <p>
                    <strong>User:</strong> {user?.fullName || user?.name || "-"}
                  </p>

                  <p>
                    <strong>Email:</strong> {user?.email || "-"}
                  </p>

                  {!isBookAvailable && (
                    <div className="reserveNote">
                      This book is currently out of stock. Select an upcoming
                      seat reservation to join the waiting list. If a copy
                      becomes available, you will receive a notification and a
                      limited-time offer.
                    </div>
                  )}

                  {eligibleReservations.length === 0 ? (
                    <div className="reserveNoReservations">
                      <h3>A Seat Reservation Is Required</h3>

                      <p>
                        {isBookAvailable
                          ? "You must reserve a seat before reserving this book. The book may only be used during your selected seat reservation."
                          : "You must have an upcoming seat reservation before joining this book waiting list. The book may only be used inside the library."}
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
                              Seat {reservation.seatId}
                              {" — "}
                              {formatReservationDate(
                                reservation.reservationDate,
                              )}
                              {" — "}
                              {formatReservationTime(reservation.startTime)}
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
                        {isBookAvailable
                          ? "The book must be collected and returned during the selected seat reservation."
                          : "The waiting-list entry is linked to this visit. If the visit is cancelled, the related book waiting-list entry will also be cancelled."}
                      </div>

                      <div className="reserveActions">
                        <Button
                          variant={isBookAvailable ? "primary" : "secondary"}
                          onClick={handleReserveBook}
                          disabled={isLoading || Boolean(successMessage)}
                        >
                          {isLoading
                            ? isBookAvailable
                              ? "Reserving..."
                              : "Joining..."
                            : successMessage
                              ? isBookAvailable
                                ? "Book Reserved"
                                : "Waiting List Joined"
                              : isBookAvailable
                                ? "Reserve Book"
                                : "Join Waiting List"}
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
