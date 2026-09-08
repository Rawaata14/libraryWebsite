/*
=========================================================
loanPropTypes.js

תיאור הקובץ:
מרכז את מבנה נתוני ההשאלה המשותף לרכיבי ניהול השאלות של הספרנית,
כדי למנוע כפילות בהגדרות PropTypes.
=========================================================
*/

import PropTypes from "prop-types";

/*
---------------------------------------------------------
loanPropType

תפקיד:
מגדיר את מבנה נתוני ההשאלה של ספר שמתקבל מה-Backend
(כולל התמיכה בהצגת כל ההשאלות הפעילות, כולל תאריך ההשאלה).
---------------------------------------------------------
*/
export const loanPropType = PropTypes.shape({
  loanId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  bookId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  bookTitle: PropTypes.string.isRequired,
  total_quantity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  loanDate: PropTypes.string, // נוסף כדי לתמוך בהצגת תאריך השאלה מכל הימים
  startTime: PropTypes.string.isRequired,
  endTime: PropTypes.string.isRequired,
  userName: PropTypes.string,
  seatId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  status: PropTypes.string.isRequired,
});
