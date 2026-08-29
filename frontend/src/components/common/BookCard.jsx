/*
=========================================================
BookCard.jsx

תיאור הקובץ:
קומפוננטה משותפת להצגת ספר בודד.

אחריות:
- הצגת תמונת הספר.
- הצגת שם הספר, המחבר והקטגוריה.
- הצגת זמינות הספר.
- הפעלת הזמנת ספר.
- הצגת פעולות עריכה ומחיקה לספרנית רק כאשר
  התקבלו פעולות מתאימות מהקומפוננטה ההורה.
=========================================================
*/

import { useContext } from "react";
import PropTypes from "prop-types";
import Button from "./Button";
import { AuthContext } from "../../context/AuthContext";
import { buildApiUrl } from "../../config/api";
import { bookPropType } from "../../propTypes/bookPropTypes";

/*
---------------------------------------------------------
getBookImageSrc

תפקיד:
מחזירה את כתובת התמונה המתאימה לספר.

אם במסד הנתונים נשמרה כתובת אינטרנט מלאה:
נעשה שימוש ישיר בכתובת.

אם נשמר רק שם הקובץ:
נבנית כתובת לתיקיית uploads של ה-Backend.
---------------------------------------------------------
*/
function getBookImageSrc(imageName) {
  if (!imageName) {
    return "";
  }

  if (
    imageName.startsWith("http://") ||
    imageName.startsWith("https://") ||
    imageName.startsWith("data:") ||
    imageName.startsWith("blob:")
  ) {
    return imageName;
  }

  return buildApiUrl(`/uploads/${encodeURIComponent(imageName)}`);
}

/*
---------------------------------------------------------
BookCard

תפקיד:
מציגה כרטיס של ספר ומאפשרת לבצע פעולות בהתאם
להרשאות המשתמש ולפעולות שהתקבלו מההורה.

isDeleting:
מציין שפעולת המחיקה מתבצעת כרגע ומונע לחיצות
כפולות על כפתור המחיקה.
---------------------------------------------------------
*/
export default function BookCard({
  book,
  onReserve,
  onEdit,
  onDelete,
  isDeleting = false,
}) {
  const { isLibrarian } = useContext(AuthContext);

  const bookImageSrc = getBookImageSrc(book.book_image_name);

  const isAvailable = Number(book.available_quantity) > 0;

  return (
    <article className="bookCard">
      {bookImageSrc && (
        <img src={bookImageSrc} alt={`Cover of ${book.title}`} loading="lazy" />
      )}

      <div className="bookCardBody">
        <div className="bookCategory">
          {book.category || "General"} ·{" "}
          <span className={isAvailable ? "available" : "unavailable"}>
            {isAvailable ? "Available" : "Out of Stock"}
          </span>
        </div>

        <h3>{book.title}</h3>

        <p>{book.author}</p>

        {onReserve && (
          <Button
            variant="success"
            onClick={onReserve}
            disabled={!isAvailable}
            aria-label={`Reserve ${book.title}`}
          >
            {isAvailable ? "Reserve" : "Not Available"}
          </Button>
        )}

        {/*
        כפתור העריכה מוצג רק לספרנית ורק אם
        הקומפוננטה ההורה העבירה פעולת onEdit.
        */}
        {isLibrarian && onEdit && (
          <Button
            variant="secondary"
            onClick={() => onEdit(book)}
            aria-label={`Edit ${book.title}`}
          >
            Edit
          </Button>
        )}

        {/*
        כפתור המחיקה מוצג רק לספרנית ורק אם
        הקומפוננטה ההורה העבירה פעולת onDelete.
        */}
        {isLibrarian && onDelete && (
          <Button
            variant="danger"
            onClick={() => onDelete(book)}
            disabled={isDeleting}
            aria-label={`Delete ${book.title}`}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        )}
      </div>
    </article>
  );
}

/*
---------------------------------------------------------
BookCard.propTypes

תפקיד:
מגדיר את מבנה הספר ואת סוגי הפעולות שהכרטיס
יכול לקבל מהקומפוננטה ההורה.
---------------------------------------------------------
*/
BookCard.propTypes = {
  book: bookPropType.isRequired,
  onReserve: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  isDeleting: PropTypes.bool,
};
