/*
=========================================================
reservationPropTypes.js

תיאור הקובץ:
מרכז את מבנה נתוני ההזמנה המשותף לרכיבי ההזמנות,
כדי למנוע כפילות בהגדרות PropTypes.
=========================================================
*/

import PropTypes from "prop-types";

/*
---------------------------------------------------------
reservationPropType

תפקיד:
מגדיר את מבנה ההזמנה שמתקבל מה-Backend.
---------------------------------------------------------
*/
export const reservationPropType = PropTypes.shape({
  reservationId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    .isRequired,
  fullName: PropTypes.string,
  email: PropTypes.string,
  seatId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  location: PropTypes.string,
  reservationDate: PropTypes.string.isRequired,
  startTime: PropTypes.string.isRequired,
  endTime: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
});
