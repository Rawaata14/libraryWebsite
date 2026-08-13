/*
=========================================================
ReservationSummary.jsx

תיאור הקובץ:
מציג כרטיסי סיכום עבור הזמנות המקומות.

הקומפוננטה מציגה:
- מספר כל ההזמנות.
- מספר ההזמנות הפעילות.
- מספר ההזמנות שבוטלו.

הקומפוננטה מקבלת את הנתונים דרך props
ואינה מבצעת חישובים או קריאות לשרת.
=========================================================
*/

import PropTypes from "prop-types";

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

/*
---------------------------------------------------------
ReservationSummary.propTypes

תפקיד:
מגדיר את נתוני סיכום ההזמנות המוצגים למשתמש.
---------------------------------------------------------
*/
ReservationSummary.propTypes = {
  totalReservations: PropTypes.number.isRequired,
  activeReservations: PropTypes.number.isRequired,
  cancelledReservations: PropTypes.number.isRequired,
};
