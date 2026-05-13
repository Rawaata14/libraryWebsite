import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import BookCard from "../common/BookCard";

export default function RecommendedBooks() {
  const navigate = useNavigate();
  const [recommendedBooks, setRecommendedBooks] = useState([]);

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/books/all-books",
        );
        setRecommendedBooks(response.data.slice(0, 4));
      } catch (error) {
        console.error("Error fetching recommended books:", error);
      }
    };
    fetchRecommended();
  }, []);

  const handleReserve = (book) => {
    navigate(`/reserve-book/${book.isbn}`, { state: book });
  };

  return (
    <section className="section">
      <h2 className="section-title">Recommended Books</h2>

      <div className="booksGrid">
        {recommendedBooks.map((book) => (
          <BookCard
            key={book.isbn} // שימוש ב-isbn מה-DB
            book={book}
            onReserve={() => handleReserve(book)}
          />
        ))}
      </div>
    </section>
  );
}
