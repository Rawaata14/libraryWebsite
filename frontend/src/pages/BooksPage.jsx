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

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/layout/PageShell";
import PageBanner from "../components/layout/PageBanner";
import BookCard from "../components/common/BookCard";

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
  {
    id: 5,
    title: "Science of Logic",
    author: "John Rivers",
    category: "Science",
    image:
      "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: 6,
    title: "Silent Tides",
    author: "Karen Blake",
    category: "Mystery",
    image:
      "https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fit=crop&w=500&q=80",
  },
];

export default function BooksPage() {
  const navigate = useNavigate();

  // מצב מקומי זמני עבור חיפוש וסינון
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // רשימת קטגוריות ייחודיות עבור תיבת הבחירה
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(books.map((book) => book.category))];
    return ["All", ...uniqueCategories];
  }, []);

  // סינון הספרים לפי חיפוש וקטגוריה
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || book.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  // מעבר לדף שריון עם נתוני הספר הנבחר
  const handleReserve = (book) => {
    navigate(`/reserve-book/${book.id}`, { state: book });
  };

  return (
    <PageShell userType="guest">
      <PageBanner title="Browse Books" />

      <div className="booksPageContainer">
        <div className="booksPageCard">
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
              <p>Please try a different search or category.</p>
            </div>
          ) : (
            <div className="booksGrid">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
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
