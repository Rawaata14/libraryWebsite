/*
=========================================================
bookPropTypes.js

תיאור הקובץ:
הגדרת מבנה ספר משותפת לקומפוננטות הספרים.
=========================================================
*/

import PropTypes from "prop-types";

/*
---------------------------------------------------------
bookPropType

תפקיד:
מגדיר את מבנה אובייקט הספר שמתקבל מה-Backend.
---------------------------------------------------------
*/
export const bookPropType = PropTypes.shape({
  bookId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  book_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  title: PropTypes.string.isRequired,
  author: PropTypes.string,
  category: PropTypes.string,
  available_quantity: PropTypes.number,
  book_image_name: PropTypes.string,
});
