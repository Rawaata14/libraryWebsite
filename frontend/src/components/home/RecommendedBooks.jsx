import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import BookCard from "../common/BookCard";
import { getAllBooks } from "../../services/bookService";

export default function RecommendedBooks() {
  const navigate = useNavigate();
  const [recommendedBooks, setRecommendedBooks] = useState([]);

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const booksData = await getAllBooks();
        setRecommendedBooks(booksData.slice(0, 4));
      } catch (error) {
        console.error("Error fetching recommended books:", error);
      }
    };
    fetchRecommended();
  }, []);

  const handleReserve = (book) => {
    navigate(`/reserve-book/${book.bookId}`, { state: book });
  };

  return (
    <section className="section">
      <h2 className="section-title">Recommended Books</h2>

      <div className="booksGrid">
        {recommendedBooks.map((book) => (
          <BookCard
            key={book.bookId} // שימוש ב-isbn מה-DB
            book={book}
            onReserve={() => handleReserve(book)}
          />
        ))}
      </div>
    </section>
  );
}
