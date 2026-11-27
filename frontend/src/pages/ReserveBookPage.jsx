/*
=========================================================
ReserveBookPage.jsx

תיאור הקובץ:
דף שריון ספר או הצטרפות לרשימת המתנה.

המשתמש:
- רואה את פרטי הספר.
- בוחר אחת מהזמנות המקום התקפות שלו.
- רואה את כמות העותקים הזמינים בהתאם להזמנה שנבחרה.
- רואה את סטטוס זמינות הספר בחלון הזמן שנבחר.
- מקבל חיווי בזמן בדיקת הזמינות.
- מקבל הודעת שגיאה במקרה שבדיקת הזמינות נכשלה.
- משריין ספר זמין לאותה הזמנה.
- מצטרף לרשימת המתנה אם אין עותק זמין.
- מקבל הודעת הצלחה בהתאם לסוג הפעולה שבוצעה.
המערכת:
- מעדכנת את התצוגה בעת החלפת הזמנת מקום.
- מונעת ביצוע פעולות לפני אימות הזמינות.
- חוסמת הזמנות כיסאות בחלונות זמן שבהם הספר כבר שוריין.
- מאפשרת בחירה של שעות ותאריכים שאינם חופפים לאחר שריון מוצלח.
- מציגה חיווי מתאים עבור הזמנות כיסאות חסומות.
- מונעת שריון כפול או הצטרפות לתור בחלון זמן חסום.
- מבדילה בין הצלחת שריון להצלחת הצטרפות לתור.
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
    blockedReservationIds,
    isSelectedReservationBlocked,
    isBookAvailable,
    availableQuantity,
    isAvailabilityReady,
    isAvailabilityLoading,
    availabilityError,
    isPageLoading,
    isLoading,
    error,
    successMessage,
    completedAction,
    handleReservationChange,
    handleReserveBook,
  } = useBookReservation();

  /*
---------------------------------------------------------
קיבוץ הזמנות המקום לפי תאריך

תפקיד:
מקבץ את הזמנות המקום התקפות של המשתמש
לפי תאריכי הביקור בספרייה.

המערכת מציגה רק תאריכים שבהם קיימת
לפחות הזמנת מקום תקפה אחת.
---------------------------------------------------------
*/
  const reservationsByDate = eligibleReservations.reduce(
    (groups, reservation) => {
      const date = formatReservationDate(reservation.reservationDate);

      if (!groups[date]) {
        groups[date] = [];
      }

      groups[date].push(reservation);

      return groups;
    },
    {},
  );

  /* רשימת תאריכי הביקור הזמינים */
  const availableDates = Object.keys(reservationsByDate);

  /* תאריך הביקור של ההזמנה שנבחרה */
  const selectedDate = selectedReservation
    ? formatReservationDate(selectedReservation.reservationDate)
    : availableDates[0] || "";

  /* הזמנות המקום השייכות לתאריך שנבחר */
  const reservationsForSelectedDate = reservationsByDate[selectedDate] || [];

  /*
---------------------------------------------------------
קיבוץ הזמנות המקום לפי חלונות זמן

תפקיד:
מקבץ את הזמנות המקום בתאריך שנבחר
לפי שעת התחלה ושעת סיום.

לוגיקה:
- יוצר קבוצה נפרדת לכל חלון זמן.
- משייך את הזמנות הכיסאות לחלון המתאים.
- שומר את פרטי ההזמנה המקוריים.
- ממיין את חלונות הזמן לפי סדר כרונולוגי.
---------------------------------------------------------
*/
  const reservationsByTime = reservationsForSelectedDate.reduce(
    (groups, reservation) => {
      const startTime = formatReservationTime(reservation.startTime);

      const endTime = formatReservationTime(reservation.endTime);

      const timeKey = `${startTime}-${endTime}`;

      if (!groups[timeKey]) {
        groups[timeKey] = {
          startTime,
          endTime,
          reservations: [],
        };
      }

      groups[timeKey].reservations.push(reservation);

      return groups;
    },
    {},
  );

  /* רשימת חלונות הזמן הממוינת לפי שעות */
  const availableTimeSlots = Object.values(reservationsByTime).sort(
    (a, b) =>
      a.startTime.localeCompare(b.startTime) ||
      a.endTime.localeCompare(b.endTime),
  );

  /*
---------------------------------------------------------
handleDateChange

תפקיד:
מטפלת בבחירת תאריך ביקור בספרייה.

פרמטרים:
date - תאריך הביקור שנבחר.

ערך מוחזר:
ללא.

לוגיקה:
- מונעת שינוי תאריך בזמן ביצוע פעולה.
- מאתרת את הזמנות המקום בתאריך שנבחר.
- נותנת עדיפות להזמנת כיסא שאינה חסומה.
- אם כל ההזמנות חסומות, בוחרת את הראשונה
  לצורך הצגת המידע בלבד.
- מפעילה בדיקת זמינות בהתאם להזמנה שנבחרה.
---------------------------------------------------------
*/
  const handleDateChange = (date) => {
    if (isLoading || date === selectedDate) {
      return;
    }

    const reservations = reservationsByDate[date] || [];

    if (reservations.length === 0) {
      return;
    }

    const firstAvailableReservation = reservations.find(
      (reservation) =>
        !blockedReservationIds.includes(Number(reservation.reservationId)),
    );

    const reservationToSelect = firstAvailableReservation || reservations[0];

    handleReservationChange(String(reservationToSelect.reservationId));
  };

  /*
---------------------------------------------------------
pageTitle

תפקיד:
קובע את כותרת הדף בהתאם לתוצאות בדיקת
זמינות הספר בחלון הזמן שנבחר.

כאשר הזמינות טרם אומתה, מוצגת כותרת כללית
שאינה קובעת אם הספר זמין או אינו זמין.
---------------------------------------------------------
*/
  const pageTitle =
    completedAction === "reservation"
      ? "Book Reservation"
      : completedAction === "waitingList"
        ? "Book Waiting List"
        : !isAvailabilityReady
          ? "Book Reservation"
          : isSelectedReservationBlocked
            ? "Book Already Reserved"
            : isBookAvailable
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

                  {completedAction === "waitingList" && (
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

              {/* הצגת שגיאה במקרה שבדיקת זמינות הספר נכשלה */}
              {availabilityError && (
                <div className="reserveError" role="alert">
                  {availabilityError}
                </div>
              )}

              <div
                className={`reserveContent ${
                  eligibleReservations.length === 0
                    ? "reserveContentWithoutReservations"
                    : ""
                }`}
              >
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
                    <strong>Available Copies:</strong>{" "}
                    {isAvailabilityLoading
                      ? "Checking..."
                      : isAvailabilityReady
                        ? availableQuantity
                        : "—"}
                  </p>

                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className={
                        completedAction === "reservation"
                          ? "available"
                          : completedAction === "waitingList"
                            ? "unavailable"
                            : !isAvailabilityReady
                              ? ""
                              : isSelectedReservationBlocked
                                ? "unavailable"
                                : isBookAvailable
                                  ? "available"
                                  : "unavailable"
                      }
                      aria-live="polite"
                    >
                      {completedAction === "reservation"
                        ? "Reserved Successfully"
                        : completedAction === "waitingList"
                          ? "On Waiting List"
                          : isAvailabilityLoading
                            ? "Checking Availability..."
                            : availabilityError
                              ? "Availability Check Failed"
                              : !selectedReservationId
                                ? "Seat Reservation Required"
                                : !isAvailabilityReady
                                  ? "Availability Not Verified"
                                  : isSelectedReservationBlocked
                                    ? "Already Reserved"
                                    : isBookAvailable
                                      ? "Available"
                                      : "Waiting List Available"}
                    </span>
                  </p>
                </section>

                <section
                  className="reserveDetails"
                  aria-labelledby="reservation-details-title"
                >
                  <h2 id="reservation-details-title">
                    Select Your Library Visit
                  </h2>

                  {eligibleReservations.length === 0 ? (
                    <div className="reserveNoReservations">
                      <h3>A Seat Reservation Is Required</h3>

                      <p>
                        You must have a valid seat reservation before reserving
                        a book or joining its waiting list. Book availability
                        will be checked according to your selected seat
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
                      {/* בחירת תאריך ביקור מתוך ההזמנות התקפות */}
                      <div className="reserveDateField">
                        <h3>Select Visit Date</h3>

                        <div className="reserveDateCards">
                          {availableDates.map((date) => {
                            const [day, month, year] = date.split("/");

                            const visitDate = new Date(
                              Number(year),
                              Number(month) - 1,
                              Number(day),
                            );

                            return (
                              <button
                                key={date}
                                type="button"
                                className={`reserveDateCard ${
                                  selectedDate === date ? "selected" : ""
                                }`}
                                onClick={() => handleDateChange(date)}
                                disabled={isLoading}
                                aria-pressed={selectedDate === date}
                                aria-label={`Select visit date ${date}`}
                              >
                                <span className="reserveDateWeekday">
                                  {visitDate.toLocaleDateString("en-US", {
                                    weekday: "long",
                                  })}
                                </span>

                                <span className="reserveDateDay">{day}</span>

                                <span className="reserveDateMonth">
                                  {visitDate.toLocaleDateString("en-US", {
                                    month: "long",
                                  })}
                                </span>

                                <span className="reserveDateYear">{year}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {/* הצגת חלונות הזמן והכיסאות בתאריך שנבחר */}
                      <div className="reserveField">
                        <div className="reserveSlotHeader">
                          <h3>Select Time & Seat</h3>

                          <span className="reserveSlotCount">
                            {availableTimeSlots.length}{" "}
                            {availableTimeSlots.length === 1
                              ? "time slot"
                              : "time slots"}
                            {" · "}
                            {reservationsForSelectedDate.length}{" "}
                            {reservationsForSelectedDate.length === 1
                              ? "reservation"
                              : "reservations"}
                          </span>
                        </div>

                        {reservationsForSelectedDate.some((reservation) =>
                          blockedReservationIds.includes(
                            Number(reservation.reservationId),
                          ),
                        ) && (
                          <p className="reserveBlockedLegend">
                            Red seats indicate time slots for which you have
                            already reserved this book.
                          </p>
                        )}

                        <div className="reserveSlotTable">
                          {/* כותרות טבלת הבחירה */}
                          <div className="reserveSlotTableHeader">
                            <span>Time Slot</span>
                            <span>Reserved Seats</span>
                          </div>

                          {/* הצגת חלונות הזמן והכיסאות המשויכים אליהם */}
                          <div className="reserveSlotTableBody">
                            {availableTimeSlots.map((slot) => (
                              <div
                                key={`${slot.startTime}-${slot.endTime}`}
                                className="reserveSlotRow"
                              >
                                <div className="reserveSlotTime">
                                  {slot.startTime}
                                  {" – "}
                                  {slot.endTime}
                                </div>

                                <div
                                  className="reserveSlotSeats"
                                  role="group"
                                  aria-label={`Seats from ${slot.startTime} to ${slot.endTime}`}
                                >
                                  {slot.reservations.map((reservation) => {
                                    const isSelected =
                                      String(selectedReservationId) ===
                                      String(reservation.reservationId);

                                    /*
                                    בדיקה האם הזמנת הכיסא חסומה לשריון הספר
                                    עקב שריון קיים בחלון זמן חופף.
                                    */
                                    const isBlocked =
                                      blockedReservationIds.includes(
                                        Number(reservation.reservationId),
                                      );

                                    return (
                                      <button
                                        key={reservation.reservationId}
                                        type="button"
                                        className={`reserveSeatButton ${
                                          isSelected ? "selected" : ""
                                        } ${isBlocked ? "blocked" : ""}`}
                                        onClick={() =>
                                          handleReservationChange(
                                            String(reservation.reservationId),
                                          )
                                        }
                                        disabled={
                                          isLoading ||
                                          isAvailabilityLoading ||
                                          isBlocked
                                        }
                                        aria-pressed={isSelected}
                                        aria-label={
                                          isBlocked
                                            ? `Seat ${reservation.seatId}: Book already reserved for this time slot`
                                            : `Select seat ${reservation.seatId}, ${slot.startTime} to ${slot.endTime}`
                                        }
                                        title={
                                          isBlocked
                                            ? "You have already reserved this book for an overlapping time slot."
                                            : "Select this seat reservation"
                                        }
                                      >
                                        Seat {reservation.seatId}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </section>

                {/* אזור סיכום ההזמנה וביצוע הפעולה */}
                {eligibleReservations.length > 0 && (
                  <div className="reserveSummary">
                    <h2>Reservation Summary</h2>

                    {/* פרטי המשתמש המבצע את ההזמנה */}
                    <p>
                      <strong>User:</strong>{" "}
                      {user?.fullName || user?.name || "-"}
                    </p>

                    <p>
                      <strong>Email:</strong> {user?.email || "-"}
                    </p>

                    {/* הודעה במקרה שאין עותקים זמינים */}
                    {isAvailabilityReady &&
                      !isBookAvailable &&
                      !isSelectedReservationBlocked &&
                      !completedAction && (
                        <div className="reserveNote">
                          No copies are available during the selected seat
                          reservation. You can join the waiting list for this
                          visit. If a copy becomes available, you will receive a
                          notification and a limited-time offer.
                        </div>
                      )}

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

                          {/* הצגת שעות איסוף הספר והחזרתו */}
                          <div className="reserveTimeCards">
                            <div className="reserveTimeCard reserveCollectionTime">
                              <dt>Book Collection</dt>

                              <dd>
                                {formatReservationTime(
                                  selectedReservation.startTime,
                                )}
                              </dd>
                            </div>

                            <div className="reserveTimeCard reserveReturnTime">
                              <dt>Book Return</dt>

                              <dd>
                                {formatReservationTime(
                                  selectedReservation.endTime,
                                )}
                              </dd>
                            </div>
                          </div>
                        </dl>
                      </div>
                    )}

                    {isAvailabilityReady && (
                      <div className="reserveNote">
                        {completedAction === "reservation"
                          ? "The book must be collected and returned during the selected seat reservation."
                          : isSelectedReservationBlocked
                            ? "You have already reserved this book for an overlapping time slot. You can select another time slot or visit date."
                            : !completedAction && isBookAvailable
                              ? "The book must be collected and returned during the selected seat reservation."
                              : "The waiting-list entry is linked to this visit. If the visit is cancelled, the related book waiting-list entry will also be cancelled."}
                      </div>
                    )}

                    <div className="reserveActions">
                      <Button
                        variant={isBookAvailable ? "primary" : "secondary"}
                        className={
                          isBookAvailable
                            ? "reserveConfirmButton"
                            : "reserveWaitingListButton"
                        }
                        onClick={handleReserveBook}
                        disabled={
                          !isAvailabilityReady ||
                          isLoading ||
                          isSelectedReservationBlocked ||
                          Boolean(successMessage)
                        }
                      >
                        {isAvailabilityLoading
                          ? "Checking Availability..."
                          : !isAvailabilityReady
                            ? "Availability Not Verified"
                            : isLoading
                              ? isBookAvailable
                                ? "Reserving..."
                                : "Joining..."
                              : completedAction === "reservation"
                                ? "Book Reserved"
                                : completedAction === "waitingList"
                                  ? "Waiting List Joined"
                                  : isSelectedReservationBlocked
                                    ? "Already Reserved"
                                    : isBookAvailable
                                      ? "Reserve Book"
                                      : "Join Waiting List"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
