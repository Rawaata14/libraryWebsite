const doQuery = require("../query");

async function addBook(bookDetails) {
  const {isbn, title, author, publishYear, status, quantity, category , image} =
    bookDetails;

    if (!isbn || !title || !author || !quantity) {
        return { success: false, message: "Missing required fields" };
    }
    const normalizedStatus = status || "available"; // Default status is "available"
    const normalizedCategory = category || "General"; // Default category is "General"
    const quantityInt = parseInt(quantity);
    if (quantityInt < 1) {
        return { success: false, message: "Quantity must be at least 1" };
    }

    try{
        const checkBookSQL = "SELECT * FROM book WHERE isbn = ?";
        const existingBook = await doQuery(checkBookSQL, [isbn]);
        if (existingBook.length > 0) {
            const book = existingBook[0];
            const newQuantity = book.quantity + quantityInt;
            const newAvailableQuantity = book.availableQuantity + quantityInt;

            const updateBookSQL = "UPDATE book SET quantity = ?, availableQuantity = ? WHERE isbn = ?";
            await doQuery(updateBookSQL, [newQuantity, newAvailableQuantity, isbn]);

            return { success: true, message: `Book already exists. Quantity updated to ${newQuantity}` };
        }
        else {
            const insertBookSQL = "INSERT INTO book (isbn, title, author, publishYear, status, quantity, availableQuantity, category, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";   
            const result = await doQuery(insertBookSQL, [isbn, title, author, publishYear, normalizedStatus, quantityInt, quantityInt, normalizedCategory, image]);

            if (result.affectedRows > 0) {
                return { success: true, message: "Book added successfully" };
            }
        }
    }
    catch(error) {
        console.error("Error adding book:", error);
        return { success: false, message: "An error occurred while adding the book" };
    }
}

module.exports = {
  addBook,
};
