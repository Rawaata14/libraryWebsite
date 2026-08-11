/*
=========================================================
ReservationsTable.jsx

תיאור הקובץ:
מציג את טבלת ההזמנות של הספרן.

הקומפוננטה אחראית על:
- מצב טעינה.
- מצב שבו לא נמצאו הזמנות.
- כותרות הטבלה.
- הצגת ReservationRow עבור כל הזמנה.

הקומפוננטה אינה מבצעת חיפוש,
סינון או קריאות לשרת.
=========================================================
*/

import ReservationRow from "./ReservationRow";

export default function ReservationsTable({
  reservations,
  isLoading,
  onCancel,
  onSendMessage,
}) {
  /*
    מצב טעינה
  */
  if (isLoading) {
    return (
      <div className="managementEmptyState">
        <span aria-hidden="true">⌛</span>

        <p>Loading reservations...</p>
      </div>
    );
  }

  /*
    מצב שבו אין תוצאות להצגה
  */
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
