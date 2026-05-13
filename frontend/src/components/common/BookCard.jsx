/*
  BookCard.jsx
  ------------
  קומפוננטה להצגת ספר בודד.

  אחריות:
  - להציג תמונת ספר, שם, מחבר וקטגוריה
  - להפעיל פעולת שריון דרך callback שמתקבל מההורה
*/

import Button from "./Button";
import useAuth from "../../hooks/useAuth";

export default function BookCard({ book, onReserve, onEdit, onDelete }) {
  const { isLibrarian } = useAuth();
  return (
    <article className="bookCard">
      <img
        src={
          book.book_image_name?.startsWith("http")
            ? book.book_image_name
            : `http://localhost:8000/uploads/${book.book_image_name}`
        }
        alt={book.title}
      />

      <div className="bookCardBody">
        <div className="bookCategory">
          {book.category} .{" "}
          <span
            className={
              book.available_quantity > 0 ? "available" : "unavailable"
            }
          >
            {book.available_quantity > 0 ? "Available" : "Out of Stock"}
          </span>
        </div>
        <h3>{book.title}</h3>
        <p>{book.author}</p>

        <Button
          variant="success"
          onClick={onReserve}
          disabled={book.available_quantity === 0}
        >
          {book.available_quantity > 0 ? "Reserve" : "Not Available"}
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
