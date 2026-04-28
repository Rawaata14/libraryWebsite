/*
  RecommendedBooks.jsx
  --------------------
  קומפוננטה להצגת ספרים מומלצים בדף הבית.

  אחריות:
  - להציג רשימת ספרים
  - להעביר את המשתמש לדף שריון הספר
  - לשלוח את נתוני הספר הנבחר לדף הבא
*/

import { useNavigate } from "react-router-dom";
import BookCard from "../common/BookCard";

const books = [
  {
    id: 1,
    title: "Mystical 10",
    author: "E.L. Timberly",
    category: "Fantasy",
    image:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: 2,
    title: "Realmlands",
    author: "Alex Rovin",
    category: "Fantasy",
    image:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: 3,
    title: "The Wanderer",
    author: "Rachel Morgan",
    category: "Fantasy",
    image:
      "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: 4,
    title: "Mistmark Hour",
    author: "S.D. Night",
    category: "Mystery",
    image:
      "https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&w=500&q=80",
  },
];

export default function RecommendedBooks() {
  const navigate = useNavigate();

  const handleReserve = (book) => {
    navigate(`/reserve-book/${book.id}`, { state: book });
  };

  return (
    <section className="section">
      <h2 className="section-title">Recommended Books</h2>

      <div className="booksGrid">
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            onReserve={() => handleReserve(book)}
          />
        ))}
      </div>
    </section>
  );
}
