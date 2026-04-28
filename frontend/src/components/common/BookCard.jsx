/*
  BookCard.jsx
  ------------
  קומפוננטה להצגת ספר בודד.

  אחריות:
  - להציג תמונת ספר, שם, מחבר וקטגוריה
  - להפעיל פעולת שריון דרך callback שמתקבל מההורה
*/

import Button from "./Button";

export default function BookCard({ book, onReserve }) {
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
      </div>
    </article>
  );
}
