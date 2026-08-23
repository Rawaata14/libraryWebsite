/*
=========================================================
BookCard.jsx

תיאור הקובץ:
קומפוננטה להצגת ספר בודד.

אחריות:
- הצגת תמונת הספר.
- הצגת שם הספר, המחבר והקטגוריה.
- הצגת זמינות הספר.
- הפעלת פעולות הזמנה, עריכה ומחיקה.
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
להרשאות המשתמש.
---------------------------------------------------------
*/
export default function BookCard({ book, onReserve, onEdit, onDelete }) {
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
          {book.category} ·{" "}
          <span className={isAvailable ? "available" : "unavailable"}>
            {isAvailable ? "Available" : "Out of Stock"}
          </span>
        </div>

        <h3>{book.title}</h3>
        <p>{book.author}</p>

        <Button variant="success" onClick={onReserve} disabled={!isAvailable}>
          {isAvailable ? "Reserve" : "Not Available"}
        </Button>

        {isLibrarian && (
          <>
            <Button variant="secondary" onClick={() => onEdit?.(book)}>
              Edit
            </Button>

            <Button variant="danger" onClick={() => onDelete?.(book)}>
              Delete
            </Button>
          </>
        )}
      </div>
    </article>
  );
}

/*
---------------------------------------------------------
BookCard.propTypes

תפקיד:
מגדיר את נתוני הספר ואת הפעולות שהכרטיס מקבל.
---------------------------------------------------------
*/
BookCard.propTypes = {
  book: bookPropType.isRequired,
  onReserve: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};
