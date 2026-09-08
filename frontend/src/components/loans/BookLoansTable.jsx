/*
=========================================================
BookLoansTable.jsx

תיאור הקובץ:
רכיב טבלה המציג את רשימת ההשאלות עבור הספרן,
עם מיקוד במועדי ההחזרה המיועדים ובזמני ההחזרה בפועל.
=========================================================
*/

import React from "react";
import PropTypes from "prop-types";
import { loanPropType } from "../../propTypes/loanPropTypes";

export default function BookLoansTable({ loans, isLoading, onReturn }) {
  if (isLoading) {
    return <div className="loansTableLoading">Loading loans...</div>;
  }

  if (!loans || loans.length === 0) {
    return <div className="loansTableEmpty">No loans found.</div>;
  }

  return (
    <div className="tableContainer">
      <table className="manageLoansTable">
        <thead>
          <tr>
            <th>Book Title</th>
            <th>User Name</th>
            <th>Seat ID</th>
            <th>Due Date & Time</th>
            <th>Actual Return Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loans.map((loan) => (
            <tr key={loan.loanId || loan.id}>
              <td>{loan.bookTitle}</td>
              <td>{loan.userName || loan.fullName || "N/A"}</td>
              <td>{loan.seatId || "N/A"}</td>
              <td>{loan.dueDate || "N/A"}</td>
              <td>{loan.returnDate || "-"}</td>
              <td>
                <span className={`statusBadge ${loan.status}`}>
                  {loan.status}
                </span>
              </td>
              <td>
                {loan.status !== "returned" && (
                  <button
                    type="button"
                    className="returnBookButton"
                    onClick={() => {
                      const idToUse = loan.loanId || loan.id || loan._id;
                      onReturn(idToUse);
                    }}
                  >
                    Return Book
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

BookLoansTable.propTypes = {
  loans: PropTypes.arrayOf(loanPropType).isRequired,
  isLoading: PropTypes.bool.isRequired,
  onReturn: PropTypes.func.isRequired,
};
