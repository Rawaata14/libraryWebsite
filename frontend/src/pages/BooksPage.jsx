/*
=========================================================
BooksPage.jsx

תיאור הקובץ:
דף המציג את מאגר הספרים במערכת.

אחריות:
- טעינת רשימת הספרים מהשרת.
- חיפוש ספר לפי שם או מחבר.
- סינון לפי קטגוריה.
- מעבר לדף הזמנת ספר.
- הוספת ספר עבור ספרנית.
- עריכת פרטי ספר וכמות עותקים.
- מחיקת ספר שאין לו היסטוריית השאלות.
=========================================================
*/

import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import BookCard from "../components/common/BookCard";
import Button from "../components/common/Button";
import BookEditModal from "../components/books/BookEditModal";
import PageBanner from "../components/layout/PageBanner";
import PageShell from "../components/layout/PageShell";

import { AuthContext } from "../context/AuthContext";

import { deleteBook, getAllBooks, updateBook } from "../services/bookService";

/*
---------------------------------------------------------
BooksPage

תפקיד:
מציגה את ספרי הספרייה ומאפשרת למשתמשים
ולספרנית לבצע פעולות בהתאם להרשאות שלהם.
---------------------------------------------------------
*/
export default function BooksPage() {
  const navigate = useNavigate();

  const { user } = useContext(AuthContext);

  const isLibrarian = user?.role === "librarian";

  const [books, setBooks] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("All");

  const [deletingBookId, setDeletingBookId] = useState(null);

  const [editingBook, setEditingBook] = useState(null);

  const [isSavingBook, setIsSavingBook] = useState(false);

  /*
  ---------------------------------------------------------
  טעינת הספרים

  תפקיד:
  שולפת את רשימת הספרים כאשר הדף נפתח.
  ---------------------------------------------------------
  */
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

  /*
  ---------------------------------------------------------
  categories

  תפקיד:
  יוצרת רשימת קטגוריות ייחודיות מתוך הספרים.
  ---------------------------------------------------------
  */
  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(books.map((book) => book.category).filter(Boolean)),
    ];

    return ["All", ...uniqueCategories];
  }, [books]);

  /*
  ---------------------------------------------------------
  filteredBooks

  תפקיד:
  מסננת את הספרים לפי טקסט החיפוש והקטגוריה
  שנבחרה.
  ---------------------------------------------------------
  */
  const filteredBooks = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return books.filter((book) => {
      const title = book.title?.toLowerCase() || "";

      const author = book.author?.toLowerCase() || "";

      const matchesSearch =
        title.includes(normalizedSearchTerm) ||
        author.includes(normalizedSearchTerm);

      const matchesCategory =
        selectedCategory === "All" || book.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [books, searchTerm, selectedCategory]);

  /*
  ---------------------------------------------------------
  handleReserve

  תפקיד:
  מעבירה את המשתמש לדף הזמנת הספר שנבחר.
  ---------------------------------------------------------
  */
  const handleReserve = (book) => {
    navigate(`/reserve-book/${book.bookId}`, {
      state: book,
    });
  };

  /*
  ---------------------------------------------------------
  handleDelete

  תפקיד:
  מבקשת אישור מהספרנית ומוחקת ספר שאין לו
  היסטוריית השאלות.

  לאחר הצלחה הספר מוסר מיד מה-State ולכן
  הכרטיס נעלם ללא טעינה מחדש של הדף.
  ---------------------------------------------------------
  */
  const handleDelete = async (book) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${book.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingBookId(book.bookId);

    try {
      const result = await deleteBook(book.bookId);

      setBooks((currentBooks) =>
        currentBooks.filter(
          (currentBook) => currentBook.bookId !== book.bookId,
        ),
      );

      window.alert(result.message || "Book deleted successfully.");
    } catch (error) {
      console.error("Error deleting book:", error);

      const serverMessage = error.response?.data?.message;

      window.alert(
        serverMessage || "An error occurred while deleting the book.",
      );
    } finally {
      setDeletingBookId(null);
    }
  };

  /*
  ---------------------------------------------------------
  handleOpenEdit

  תפקיד:
  שומרת את הספר שנבחר ומציגה את חלון העריכה.
  ---------------------------------------------------------
  */
  const handleOpenEdit = (book) => {
    setEditingBook(book);
  };

  /*
  ---------------------------------------------------------
  handleCloseEdit

  תפקיד:
  סוגרת את חלון העריכה אם לא מתבצעת שמירה.
  ---------------------------------------------------------
  */
  const handleCloseEdit = () => {
    if (!isSavingBook) {
      setEditingBook(null);
    }
  };

  /*
  ---------------------------------------------------------
  handleUpdateBook

  תפקיד:
  שולחת את פרטי הספר המעודכנים לשרת.

  לאחר הצלחה:
  - הספר המעודכן מחליף את הספר הקודם ב-State.
  - הכרטיס מתעדכן ללא רענון הדף.
  - חלון העריכה נסגר.
  ---------------------------------------------------------
  */
  const handleUpdateBook = async (bookDetails) => {
    if (!editingBook) {
      return;
    }

    setIsSavingBook(true);

    try {
      const result = await updateBook(editingBook.bookId, bookDetails);

      setBooks((currentBooks) =>
        currentBooks.map((currentBook) =>
          currentBook.bookId === result.book.bookId ? result.book : currentBook,
        ),
      );

      setEditingBook(null);

      window.alert(result.message || "Book updated successfully.");
    } catch (error) {
      /*
        השגיאה נזרקת מחדש כדי ש-BookEditModal
        יציג את הודעת השרת בתוך החלון.
        */
      console.error("Error updating book:", error);

      throw error;
    } finally {
      setIsSavingBook(false);
    }
  };

  return (
    <PageShell>
      <PageBanner title="Browse Books" />

      <div className="booksPageContainer">
        <div className="booksPageCard">
          {isLibrarian && (
            <div
              style={{
                marginBottom: "20px",
                textAlign: "right",
              }}
            >
              <Button
                variant="primary"
                onClick={() => navigate("/admin/add-book")}
              >
                + Add Book
              </Button>
            </div>
          )}

          <div className="booksToolbar">
            <label className="visuallyHidden" htmlFor="books-search">
              Search books
            </label>

            <input
              id="books-search"
              type="search"
              className="booksSearchInput"
              placeholder={"Search by title or author"}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <label className="visuallyHidden" htmlFor="books-category">
              Filter by category
            </label>

            <select
              id="books-category"
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

          <div className="booksResultsInfo" role="status" aria-live="polite">
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
                  onEdit={isLibrarian ? handleOpenEdit : undefined}
                  onDelete={isLibrarian ? handleDelete : undefined}
                  isDeleting={deletingBookId === book.bookId}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <BookEditModal
        book={editingBook}
        isSaving={isSavingBook}
        onClose={handleCloseEdit}
        onSave={handleUpdateBook}
      />
    </PageShell>
  );
}
