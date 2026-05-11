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
      <img src={book.image} alt={book.title} />

      <div className="bookCardBody">
        <div className="bookCategory">{book.category}</div>
        <h3>{book.title}</h3>
        <p>{book.author}</p>

        <Button variant="success" onClick={onReserve}>
          Reserve
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
