/*
  AddBookPage.jsx
  ---------------
  דף המאפשר לספרנית להוסיף ספר חדש למערכת.
*/

import { useState } from "react";
import PageShell from "../components/layout/PageShell";
import PageBanner from "../components/layout/PageBanner";
import InputField from "../components/common/InputField";
import Button from "../components/common/Button";
import axios from "axios";

export default function AddBookPage() {
  const [formData, setFormData] = useState({
    isbn: "",
    title: "",
    author: "",
    publishYear: "",
    status: "available",
    category: "",
    quantity: 1,
    image: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "quantity") {
      const numericValue = parseInt(value);
      if (numericValue < 1) {
        setFormData((prev) => ({ ...prev, [name]: 1 }));
        return;
      }
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.quantity < 1) {
      alert("Quantity must be at least 1");
      return;
    }

    const bookData = new FormData();
    bookData.append("isbn", formData.isbn);
    bookData.append("title", formData.title);
    bookData.append("author", formData.author);
    bookData.append("category", formData.category);
    bookData.append("publishYear", parseInt(formData.publishYear));
    bookData.append("status", formData.status);
    bookData.append("quantity", formData.quantity);

    if (selectedFile) {
      bookData.append("image", selectedFile);
    }

    try {
      const response = await axios.post(
        "http://localhost:8000/books/add-book",
        bookData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        },
      );
      alert(response.data.message || "Book added successfully!");
      if (response.status === 201 || response.status === 200) {
        setFormData({
          isbn: "",
          title: "",
          author: "",
          publishYear: "",
          status: "available",
          category: "",
          quantity: 1,
          image: "",
        });
        setSelectedFile(null);
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "An error occurred while adding the book.";
      alert(message);
      console.error("Error details:", error);
    }
  };

  return (
    <PageShell>
      <PageBanner title="Add New Book" />

      <div
        className="authPage"
        style={{ minHeight: "auto", padding: "40px 0" }}
      >
        <form
          className="authCard"
          style={{ maxWidth: "600px" }}
          onSubmit={handleSubmit}
        >
          <h2>Book Details</h2>
          <p>Fill in the information to add a book to the library collection</p>

          <div className="stackCol">
            <InputField
              label="ISBN"
              name="isbn"
              value={formData.isbn}
              onChange={handleChange}
              placeholder="e.g. 978-0-7432-7356-5"
              required
            />

            <InputField
              label="Book Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. The Great Gatsby"
              required
            />

            <InputField
              label="Author Name"
              name="author"
              value={formData.author}
              onChange={handleChange}
              placeholder="e.g. F. Scott Fitzgerald"
              required
            />

            <InputField
              label="Publish Year"
              name="publishYear"
              value={formData.publishYear}
              onChange={handleChange}
              placeholder="e.g. 1925"
              required
            />

            <InputField
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="e.g. Classic Literature"
              required
            />

            <div className="formGroup">
              <label className="label">Book Cover Image</label>
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                accept="image/*"
                required
                style={{ display: "none" }} // מחביא את הכפתור המקורי
              />
              <label
                htmlFor="file-upload"
                className="input"
                style={{
                  display: "block",
                  cursor: "pointer",
                  textAlign: "center",
                  padding: "12px",
                  border: "1px dashed #666",
                  background: "#f9f9f9",
                  color: "#333",
                }}
              >
                {selectedFile
                  ? `Selected: ${selectedFile.name}`
                  : "Choose File"}
              </label>
            </div>

            <InputField
              label="Quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              type="number"
              min="1"
              placeholder="e.g. 5"
              required
            />

            <Button type="submit" variant="primary">
              Add Book to Catalog
            </Button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
