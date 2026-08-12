/*
=========================================================
seatPropTypes.js

תיאור הקובץ:
הגדרות PropTypes משותפות לפריטי מפת הספרייה.

הקובץ מרכז את מבנה המושב ואת מבנה אזורי המפה,
כדי למנוע הגדרות כפולות ברכיבי המפה השונים.
=========================================================
*/

import PropTypes from "prop-types";

/*
---------------------------------------------------------
seatPropType

תפקיד:
מגדיר את מבנה פריט המפה שמתקבל מה-Backend.
---------------------------------------------------------
*/
export const seatPropType = PropTypes.shape({
  seatId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  type: PropTypes.string.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  rotation: PropTypes.number,
  status: PropTypes.string.isRequired,
  reservable: PropTypes.bool,
  location: PropTypes.string,
});

/*
---------------------------------------------------------
mapZonePropType

תפקיד:
מגדיר את מבנה האזור המותר להצבת פריטים במפה.
---------------------------------------------------------
*/
export const mapZonePropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  minX: PropTypes.number.isRequired,
  maxX: PropTypes.number.isRequired,
  minY: PropTypes.number.isRequired,
  maxY: PropTypes.number.isRequired,
  labelX: PropTypes.number.isRequired,
  labelY: PropTypes.number.isRequired,
});
