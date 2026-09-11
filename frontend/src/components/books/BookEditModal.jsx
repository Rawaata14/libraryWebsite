/*
=========================================================
BookEditModal.jsx

תיאור הקובץ:
חלון עריכת ספר עבור הספרנית.

אחריות:
- עריכת פרטי הספר.
- עריכת הכמות הכוללת.
- הצגת מספר העותקים שאינם זמינים.
- הצגת הכמות שתהיה זמינה לאחר השמירה.
- מניעת הקטנת הכמות מתחת למספר העותקים
  שכבר אינם זמינים.
- אפשרות לפתיחת נעילת שדה ה-ISBN באמצעות מנעול.
=========================================================
*/

import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

import { bookPropType } from "../../propTypes/bookPropTypes";

/*
---------------------------------------------------------
BookEditModal

תפקיד:
מציגה חלון עריכה מעל עמוד הספרים.
---------------------------------------------------------
*/
export default function BookEditModal({
  book,
  isSaving = false,
  onClose,
  onSave,
}) {
  const [formData, setFormData] = useState({
    isbn: "",
    title: "",
    author: "",
    publishYear: "",
    category: "",
    totalQuantity: "1",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [isIsbnEditable, setIsIsbnEditable] = useState(false);

  /*
  ---------------------------------------------------------
  טעינת פרטי הספר לטופס
  ---------------------------------------------------------
  */
  useEffect(() => {
    if (!book) {
      return;
    }

    setFormData({
      isbn: book.isbn || "",
      title: book.title || "",
      author: book.author || "",
      publishYear: book.publishYear || "",
      category: book.category || "General",
      totalQuantity: String(book.total_quantity ?? book.totalQuantity ?? 1),
    });

    setErrorMessage("");
    setIsIsbnEditable(false);
  }, [book]);

  /*
  ---------------------------------------------------------
  סגירת החלון באמצעות Escape
  ---------------------------------------------------------
  */
  useEffect(() => {
    if (!book) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [book, isSaving, onClose]);

  /*
  ---------------------------------------------------------
  unavailableCopies

  מחשב כמה עותקים אינם זמינים כרגע בצורה בטוחה.
  ---------------------------------------------------------
  */
  const unavailableCopies = useMemo(() => {
    if (!book) {
      return 0;
    }

    const total = Number(book.total_quantity ?? book.totalQuantity) || 0;

    const available = Number(
      book.available_quantity ??
        book.availableQuantity ??
        book.remainingCopies ??
        0,
    );

    return Math.max(0, total - available);
  }, [book]);

  if (!book) {
    return null;
  }

  /*
  ---------------------------------------------------------
  handleChange

  מעדכנת את שדה הטופס שהשתנה.
  ---------------------------------------------------------
  */
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    setErrorMessage("");
  };

  /*
  ---------------------------------------------------------
  handleSubmit
  ---------------------------------------------------------
  */
  const handleSubmit = async (event) => {
    event.preventDefault();

    const totalQuantity = Number.parseInt(formData.totalQuantity, 10);

    if (!Number.isInteger(totalQuantity) || totalQuantity < 1) {
      setErrorMessage("Total quantity must be at least 1.");
      return;
    }

    if (totalQuantity < unavailableCopies) {
      setErrorMessage(
        `Quantity cannot be lower than ${unavailableCopies}, ` +
          `because ${unavailableCopies} copies are currently unavailable.`,
      );
      return;
    }

    try {
      await onSave({
        ...formData,
        totalQuantity,
      });
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "An error occurred while updating the book.",
      );
    }
  };

  const availableAfterSaving = Math.max(
    0,
    Number(formData.totalQuantity || 0) - unavailableCopies,
  );

  return (
    <div
      className="bookEditOverlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      <section
        className="bookEditModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-edit-title"
      >
        <div className="bookEditHeader">
          <div>
            <h2 id="book-edit-title">Edit Book</h2>
            <p>Update the book details and library inventory.</p>
          </div>

          <button
            type="button"
            className="bookEditCloseButton"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close edit book dialog"
          >
            ×
          </button>
        </div>

        <form className="bookEditForm" onSubmit={handleSubmit}>
          <label htmlFor="edit-book-isbn">
            ISBN
            <div className="isbnInputWrapper">
              <input
                id="edit-book-isbn"
                name="isbn"
                value={formData.isbn}
                onChange={handleChange}
                disabled={!isIsbnEditable}
                required
              />
              <button
                type="button"
                className="isbnUnlockButton"
                onClick={() => setIsIsbnEditable((prev) => !prev)}
                aria-label={
                  isIsbnEditable ? "Lock ISBN field" : "Unlock ISBN field"
                }
                title={
                  isIsbnEditable ? "ISBN is editable" : "Click to unlock ISBN"
                }
              >
                {isIsbnEditable ? "🔓" : "🔒"}
              </button>
            </div>
          </label>

          <label htmlFor="edit-book-title">
            Title
            <input
              id="edit-book-title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </label>

          <label htmlFor="edit-book-author">
            Author
            <input
              id="edit-book-author"
              name="author"
              value={formData.author}
              onChange={handleChange}
              required
            />
          </label>

          <label htmlFor="edit-book-category">
            Category
            <input
              id="edit-book-category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            />
          </label>

          <label htmlFor="edit-book-publish-year">
            Publish Year
            <input
              id="edit-book-publish-year"
              name="publishYear"
              type="number"
              min="1000"
              max={new Date().getFullYear()}
              value={formData.publishYear}
              onChange={handleChange}
            />
          </label>

          <label htmlFor="edit-book-total-quantity">
            Total Copies
            <input
              id="edit-book-total-quantity"
              name="totalQuantity"
              type="number"
              min={Math.max(1, unavailableCopies)}
              value={formData.totalQuantity}
              onChange={handleChange}
              required
            />
          </label>

          <div className="bookInventorySummary">
            <span>Currently unavailable: {unavailableCopies}</span>
            <span>Available after saving: {availableAfterSaving}</span>
          </div>

          {errorMessage && (
            <div className="bookEditError" role="alert">
              {errorMessage}
            </div>
          )}

          <div className="bookEditActions">
            <button
              type="button"
              className="bookEditCancelButton"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="bookEditSaveButton"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

BookEditModal.propTypes = {
  book: bookPropType,
  isSaving: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};
