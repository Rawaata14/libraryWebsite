/*
=========================================================
BookCard.jsx

תיאור הקובץ:
קומפוננטה משותפת להצגת ספר בודד.

אחריות:
- הצגת תמונת הספר.
- הצגת שם הספר, המחבר והקטגוריה.
- הצגת זמינות הספר.
- מעבר לדף שריון ספר.
- אפשרות לבדיקת זמינות עתידית של ספר שאינו זמין.
- הצגת כפתור פעולה בהתאם לזמינות הספר בקטלוג.
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
להרשאות המשתמש ולזמינות הספר.

עבור משתמש רגיל:
- ספר עם השאלה אישית פתוחה מציג View My Reservations.
- ספר זמין ללא השאלה אישית מציג Reserve Book.
- ספר שאינו זמין ללא השאלה אישית מציג Check Future Availability.

כל הכפתורים מעבירים לדף שריון הספר,
ללא ביצוע שריון או הצטרפות ישירה לרשימת המתנה.

בדף שריון הספר:
- המשתמש בוחר הזמנת מקום תקפה.
- המערכת בודקת זמינות בהתאם לתאריך ולשעות
  של הזמנת המקום שנבחרה.
- אם קיים עותק זמין, ניתן לשריין את הספר.
- אם אין עותק זמין, ניתן להצטרף לרשימת ההמתנה.

עבור ספרנית:
- פעולת ההזמנה אינה מוצגת.
- פעולות עריכה ומחיקה מוצגות כאשר התקבלו
  מהקומפוננטה ההורה.

isDeleting:
מציין שפעולת המחיקה מתבצעת כרגע ומונע
לחיצות כפולות על כפתור המחיקה.
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
  const hasActiveLoan = Number(book.userHasActiveLoan) === 1;

  return (
    <article className="bookCard">
      <div className="bookCover">
        {bookImageSrc ? (
          <img
            src={bookImageSrc}
            alt={`Cover of ${book.title}`}
            loading="lazy"
          />
        ) : (
          <div className="bookCoverPlaceholder">No cover available</div>
        )}
      </div>

      <div className="bookCardBody">
        <div className="bookCategory">{book.category || "General"}</div>

        <div
          className={`bookAvailability ${
            isAvailable ? "available" : "unavailable"
          }`}
        >
          {isAvailable ? "Available" : "Out of Stock"}
        </div>

        <h3 className="bookTitle">{book.title}</h3>

        <p className="bookAuthor">{book.author}</p>

        <div className="bookMetadata">
          <p>
            <strong>Published:</strong> {book.publishYear ?? "Not specified"}
          </p>
          <p>
            <strong>ISBN:</strong> {book.isbn || "Not specified"}
          </p>
        </div>

        <div className="bookCardActions">
          {/*
פעולת המשתמש מוצגת רק לקורא.

כאשר קיימת השאלה פתוחה של הספר:
- מוצג כפתור View My Reservations.

כאשר אין השאלה פתוחה והספר זמין:
- מוצג כפתור Reserve Book.

כאשר אין השאלה פתוחה והספר אינו זמין:
- מוצג כפתור Check Future Availability.

כל הכפתורים מובילים לדף שריון הספר,
ללא ביצוע שריון או הצטרפות ישירה לרשימת המתנה.
*/}
          {!isLibrarian && onReserve && (
            <Button
              variant={hasActiveLoan || !isAvailable ? "secondary" : "success"}
              className={
                hasActiveLoan || !isAvailable
                  ? "bookAvailabilityButton"
                  : "bookReserveButton"
              }
              onClick={onReserve}
              aria-label={
                hasActiveLoan
                  ? `View my reservations for ${book.title}`
                  : isAvailable
                    ? `Reserve ${book.title}`
                    : `Check future availability for ${book.title}`
              }
            >
              {hasActiveLoan
                ? "View My Reservations"
                : isAvailable
                  ? "Reserve Book"
                  : "Check Future Availability"}
            </Button>
          )}
          {/*
        כפתור העריכה מוצג רק לספרנית ורק אם
        הקומפוננטה ההורה העבירה פעולת onEdit.
        */}
          {isLibrarian && onEdit && (
            <Button
              variant="secondary"
              className="bookEditButton"
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
              className="bookDeleteButton"
              onClick={() => onDelete(book)}
              disabled={isDeleting}
              aria-label={`Delete ${book.title}`}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          )}
        </div>
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
  isLibrarian: PropTypes.bool,
};
