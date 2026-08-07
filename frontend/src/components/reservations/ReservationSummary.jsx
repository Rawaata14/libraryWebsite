/*
=========================================================
ReservationSummary.jsx

תיאור הקובץ:
מציג כרטיסי סיכום עבור הזמנות המקומות.

הקומפוננטה מציגה:
- מספר כל ההזמנות.
- מספר ההזמנות הפעילות.
- מספר ההזמנות שבוטלו.
=========================================================
*/

/*
---------------------------------------------------------
ReservationSummary

תפקיד:
מקבלת נתוני סיכום מהעמוד הראשי ומציגה אותם
בשלושה כרטיסי מידע.

הקומפוננטה אינה מבצעת חישובים או קריאות לשרת.
---------------------------------------------------------
*/
export default function ReservationSummary({
  totalReservations,
  activeReservations,
  cancelledReservations,
}) {
  return (
    <div className="managementSummaryGrid">
      <div className="managementSummaryCard">
        <span aria-hidden="true">📅</span>

        <div>
          <strong>{totalReservations}</strong>
          <p>Total Reservations</p>
        </div>
      </div>

      <div className="managementSummaryCard">
        <span aria-hidden="true">✅</span>

        <div>
          <strong>{activeReservations}</strong>
          <p>Active Reservations</p>
        </div>
      </div>

      <div className="managementSummaryCard">
        <span aria-hidden="true">❌</span>

        <div>
          <strong>{cancelledReservations}</strong>
          <p>Cancelled Reservations</p>
        </div>
      </div>
    </div>
  );
}
