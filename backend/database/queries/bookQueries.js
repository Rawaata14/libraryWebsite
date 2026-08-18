const doQuery = require("../query");

async function addBook(bookDetails) {
  const {
    isbn,
    title,
    author,
    publishYear,
    status,
    quantity,
    category,
    image,
  } = bookDetails;

  if (!isbn || !title || !author || !quantity) {
    return { success: false, message: "Missing required fields" };
  }
  const normalizedStatus = status || "available"; // Default status is "available"
  const normalizedCategory = category || "General"; // Default category is "General"
  const quantityInt = parseInt(quantity);
  if (quantityInt < 1) {
    return { success: false, message: "Quantity must be at least 1" };
  }

  try {
    const checkBookSQL = "SELECT * FROM book WHERE isbn = ?";
    const existingBook = await doQuery(checkBookSQL, [isbn]);
    if (existingBook.length > 0) {
      const book = existingBook[0];
      const newQuantity = book.quantity + quantityInt;
      const newAvailableQuantity = book.availableQuantity + quantityInt;

      const updateBookSQL =
        "UPDATE book SET quantity = ?, availableQuantity = ? WHERE isbn = ?";
      await doQuery(updateBookSQL, [newQuantity, newAvailableQuantity, isbn]);

      return {
        success: true,
        message: `Book already exists. Quantity updated to ${newQuantity}`,
      };
    } else {
      console.log("Adding new book with details:", bookDetails);
      const insertBookSQL =
        "INSERT INTO book (isbn, title, author, publishYear, status, total_quantity, available_quantity, category, book_image_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
      const result = await doQuery(insertBookSQL, [
        isbn,
        title,
        author,
        publishYear,
        normalizedStatus,
        quantityInt,
        quantityInt,
        normalizedCategory,
        image,
      ]);

      if (result.affectedRows > 0) {
        return { success: true, message: "Book added successfully" };
      }
    }
  } catch (error) {
    console.error("Error adding book:", error);
    return {
      success: false,
      message: "An error occurred while adding the book",
    };
  }
}

async function getAllBooks() {
  try {
    const sql = "SELECT * FROM book";
    const books = await doQuery(sql);
    return books;
  } catch (error) {
    console.error("Error fetching books:", error);
    throw new Error("An error occurred while fetching books");
  }
}

async function getBookById(bookId) {
  try {
    const sql = "SELECT * FROM book WHERE bookId = ?";
    const books = await doQuery(sql, [bookId]);
    if (books.length === 0) {
      return null; // No book found with the given ID
    }
    return books[0]; // Return the first (and only) book found
  } catch (error) {
    console.error("Error fetching book by ID:", error);
    throw new Error("An error occurred while fetching the book by ID");
  }
}

async function reserveBook(bookId, userId) {
  try {
    // בדיקה האם הספר קיים ויש עותקים זמינים
    const checkSql = "SELECT * FROM book WHERE bookId = ?";
    const books = await doQuery(checkSql, [bookId]);

    if (books.length === 0) {
      return { success: false, message: "Book not found" };
    }

    const book = books[0];

    if (book.available_quantity <= 0) {
      return { success: false, message: "No available copies for reservation" };
    }

    // עדכון כמות העותקים הזמינים (הפחתה ב-1)
    const newAvailableQuantity = book.available_quantity - 1;
    const updateSql = "UPDATE book SET available_quantity = ? WHERE bookId = ?";
    await doQuery(updateSql, [newAvailableQuantity, bookId]);

    const loanDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(loanDate.getDate() + 14); // הגדרת תאריך החזרה ל-14 ימים מהיום

    const status = "active"; // סטטוס ההשאלה

    const insertLoanSql =
      "INSERT INTO loan (userId, bookId, loanDate, dueDate, status) VALUES (?, ?, ?, ?, ?)";
    const result = await doQuery(insertLoanSql, [userId, bookId, loanDate, dueDate, status]); // כאן יש להחליף את userId ב-ID של המשתמש שמבצע את השריון

    if (result.affectedRows > 0) {
      return { success: true, message: "Book reserved successfully" };
    }

    return { success: false, message: "Failed to reserve book" };
  } catch (error) {
    console.error("Error reserving book:", error);
    throw error;
  }
}

module.exports = {
  addBook,
  getAllBooks,
  getBookById,
  reserveBook,
};
