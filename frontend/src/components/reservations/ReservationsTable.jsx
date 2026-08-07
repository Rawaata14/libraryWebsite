/*
=========================================================
ReservationsTable.jsx

תיאור הקובץ:
מציג את טבלת ההזמנות של הספרן.

הקומפוננטה אחראית על:
- מצב טעינה.
- מצב שבו לא נמצאו הזמנות.
- מבנה כותרות הטבלה.
- הצגת שורת ReservationRow עבור כל הזמנה.
=========================================================
*/

import ReservationRow from "./ReservationRow";

/*
---------------------------------------------------------
ReservationsTable

תפקיד:
מקבלת רשימת הזמנות ומציגה אותה בטבלה.

הקומפוננטה אינה מבצעת חיפוש, סינון או קריאות לשרת.
היא מקבלת רשימה שכבר סוננה מהעמוד הראשי.
---------------------------------------------------------
*/
export default function ReservationsTable({
  reservations,
  isLoading,
  onCancel,
  onSendMessage,
}) {
  if (isLoading) {
    return (
      <div className="managementEmptyState">
        <span aria-hidden="true">⌛</span>
        <p>Loading reservations...</p>
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="managementEmptyState">
        <span aria-hidden="true">📭</span>

        <h3>No reservations found</h3>

        <p>No reservations match the selected filters.</p>
      </div>
    );
  }

  return (
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
          {reservations.map((reservation) => (
            <ReservationRow
              key={reservation.reservationId}
              reservation={reservation}
              onCancel={onCancel}
              onSendMessage={onSendMessage}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
