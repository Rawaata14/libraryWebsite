/*
=========================================================
ReturnLoanModal.jsx

תיאור הקובץ:
חלון אישור החזרת ספר עבור הספרן.

הקומפוננטה מציגה:
- פרטי ההשאלה (כותרת הספר, שם המשתמש, תאריכים).
- שדה להערות או סיבת החזרה (אופציונלי).
- כפתורי אישור וסגירה.

הקומפוננטה אינה מבצעת קריאת API.
פעולת ההחזרה מתקבלת דרך onConfirm.
=========================================================
*/

import PropTypes from "prop-types";

export default function ReturnLoanModal({
  loan,
  returnNotes,
  isReturning,
  onNotesChange,
  onClose,
  onConfirm,
}) {
  /*
    אם לא נבחרה השאלה,
    אין צורך להציג את החלון.
  */
  if (!loan) {
    return null;
  }

  return (
    <div
      className="cancellationModalOverlay"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="cancellationModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="return-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="cancellationModalHeader">
          <div>
            <h2 id="return-modal-title">Return Book to Inventory</h2>
            <p>Loan #{loan.loanId || loan.id}</p>
          </div>

          <button
            type="button"
            className="closeCancellationModalButton"
            onClick={onClose}
            disabled={isReturning}
            aria-label="Close return window"
          >
            ×
          </button>
        </div>

        <div className="cancellationReservationInfo">
          <p>
            <span>Book</span>
            <strong>{loan.bookTitle || "Unknown Book"}</strong>
          </p>

          <p>
            <span>User</span>
            <strong>{loan.userName || loan.fullName || "Unknown User"}</strong>
          </p>

          <p>
            <span>Loan Date</span>
            <strong>{loan.loanDate || loan.borrowDate || "N/A"}</strong>
          </p>

          <p>
            <span>Due Date</span>
            <strong>{loan.dueDate || "N/A"}</strong>
          </p>
        </div>

        <label className="cancellationReasonField" htmlFor="return-notes">
          <span>Return Notes (Optional)</span>

          <textarea
            id="return-notes"
            value={returnNotes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Add any notes regarding the book condition or return..."
            maxLength={300}
            rows={4}
            disabled={isReturning}
          />

          <small>{returnNotes.length}/300 characters</small>
        </label>

        <p className="cancellationWarning">
          The book status will be updated to returned and added back to
          available inventory.
        </p>

        <div className="cancellationModalActions">
          <button
            type="button"
            className="keepReservationButton"
            onClick={onClose}
            disabled={isReturning}
          >
            Cancel
          </button>

          <button
            type="button"
            className="confirmCancellationButton"
            onClick={onConfirm}
            disabled={isReturning}
          >
            {isReturning ? "Returning..." : "Confirm Return"}
          </button>
        </div>
      </section>
    </div>
  );
}

/*
---------------------------------------------------------
ReturnLoanModal.propTypes

תפקיד:
מגדיר את נתוני ההשאלה, הערות ההחזרה והפעולות של חלון
אישור החזרת הספר.
---------------------------------------------------------
*/
ReturnLoanModal.propTypes = {
  loan: PropTypes.shape({
    loanId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    bookTitle: PropTypes.string,
    userName: PropTypes.string,
    fullName: PropTypes.string,
    loanDate: PropTypes.string,
    borrowDate: PropTypes.string,
    dueDate: PropTypes.string,
  }),
  returnNotes: PropTypes.string.isRequired,
  isReturning: PropTypes.bool.isRequired,
  onNotesChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};
