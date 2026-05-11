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

export default function AddBookPage() {
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    category: "",
    image: "",
    description: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Saving book data:", formData);
    alert("הספר נשמר בהצלחה! (כרגע רק בקונסול)");
    // כאן בעתיד תבוא הקריאה לשרת (axios.post)
  };

  return (
    <PageShell userType="librarian">
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
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="e.g. Classic Literature"
              required
            />

            <InputField
              label="Image URL"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="Link to book cover image"
            />

            <div className="formGroup">
              <label className="label">Description</label>
              <textarea
                className="input"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief summary of the book..."
                rows="4"
                style={{ resize: "vertical", padding: "10px" }}
              />
            </div>

            <Button type="submit" variant="primary">
              Add Book to Catalog
            </Button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
