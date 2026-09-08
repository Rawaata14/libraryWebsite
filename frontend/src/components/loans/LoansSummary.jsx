/*
=========================================================
LoansSummary.jsx

תיאור הקובץ:
מציג כרטיסי סיכום עבור השאלות הספרים.

הקומפוננטה מציגה:
- מספר כל ההשאלות.
- מספר ההשאלות הפעילות.
- מספר ההשאלות באיחור (Overdue).

הקומפוננטה מקבלת את הנתונים דרך props
ואינה מבצעת חישובים או קריאות לשרת.
=========================================================
*/

import PropTypes from "prop-types";

export default function LoansSummary({
  totalLoans,
  activeLoans,
  overdueLoans,
}) {
  return (
    <div className="managementSummaryGrid">
      <div className="managementSummaryCard">
        <span aria-hidden="true">📚</span>

        <div>
          <strong>{totalLoans}</strong>
          <p>Total Loans</p>
        </div>
      </div>

      <div className="managementSummaryCard">
        <span aria-hidden="true">🔄</span>

        <div>
          <strong>{activeLoans}</strong>
          <p>Active Loans</p>
        </div>
      </div>

      <div className="managementSummaryCard">
        <span aria-hidden="true">⚠️</span>

        <div>
          <strong>{overdueLoans}</strong>
          <p>Overdue Loans</p>
        </div>
      </div>
    </div>
  );
}

/*
---------------------------------------------------------
LoansSummary.propTypes

תפקיד:
מגדיר את נתוני סיכום ההשאלות המוצגים למשתמש.
---------------------------------------------------------
*/
LoansSummary.propTypes = {
  totalLoans: PropTypes.number.isRequired,
  activeLoans: PropTypes.number.isRequired,
  overdueLoans: PropTypes.number.isRequired,
};
