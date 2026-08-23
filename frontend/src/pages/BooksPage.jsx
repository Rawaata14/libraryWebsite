/*
  BooksPage.jsx
  -------------
  דף המציג את מאגר הספרים במערכת.

  אחריות:
  - להציג רשימת ספרים
  - לאפשר חיפוש לפי שם ספר או מחבר
  - לאפשר סינון לפי קטגוריה
  - לאפשר מעבר לדף שריון ספר
*/

import { useMemo, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/layout/PageShell";
import PageBanner from "../components/layout/PageBanner";
import BookCard from "../components/common/BookCard";
import { AuthContext } from "../context/AuthContext";
import Button from "../components/common/Button";
import { getAllBooks } from "../services/bookService";

export default function BooksPage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); // חילוץ המשתמש המחובר

  // בדיקה האם המשתמש הוא ספרנית
  const isLibrarian = user?.role === "librarian";
  const [books, setBooks] = useState([]); // כאן תוכל להוסיף לוגיקה לטעינת הספרים מהשרת
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const booksData = await getAllBooks();
        setBooks(booksData);
      } catch (error) {
        console.error("Error fetching books:", error);
      }
    };

    fetchBooks();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(books.map((book) => book.category))];
    return ["All", ...uniqueCategories];
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || book.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory, books]);

  const handleReserve = (book) => {
    navigate(`/reserve-book/${book.bookId}`, { state: book });
  };

  return (
    <PageShell>
      <PageBanner title="Browse Books" />

      <div className="booksPageContainer">
        <div className="booksPageCard">
          {/* כפתור הוספת ספר - יוצג רק לספרנית */}
          {isLibrarian && (
            <div style={{ marginBottom: "20px", textAlign: "right" }}>
              <Button
                variant="primary"
                onClick={() => navigate("/admin/add-book")}
              >
                + Add Book
              </Button>
            </div>
          )}

          <div className="booksToolbar">
            <input
              type="text"
              className="booksSearchInput"
              placeholder="Search by title or author"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <select
              className="booksCategorySelect"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="booksResultsInfo">
            Showing {filteredBooks.length} of {books.length} books
          </div>

          {filteredBooks.length === 0 ? (
            <div className="booksEmptyState">
              <h3>No books found</h3>
            </div>
          ) : (
            <div className="booksGrid">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.bookId}
                  book={book}
                  onReserve={() => handleReserve(book)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
