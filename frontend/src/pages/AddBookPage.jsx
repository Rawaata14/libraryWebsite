/*
=========================================================
AddBookPage.jsx

תיאור הקובץ:
דף המאפשר לספרנית להוסיף ספר חדש למערכת.

העמוד אחראי על:
- הצגת שדות פרטי הספר.
- הצגת בחירת תמונת הכריכה.
- חיבור הטופס ל-useAddBookForm.

מצב הטופס והשליחה מנוהלים באמצעות:
useAddBookForm
=========================================================
*/

import PageShell from "../components/layout/PageShell";
import PageBanner from "../components/layout/PageBanner";
import InputField from "../components/common/InputField";
import Button from "../components/common/Button";

import useAddBookForm from "../hooks/useAddBookForm";

/*
---------------------------------------------------------
AddBookPage

תפקיד:
מציגה את טופס הוספת הספר ומחברת אותו
ללוגיקה שב-useAddBookForm.
---------------------------------------------------------
*/
export default function AddBookPage() {
  const {
    formData,
    selectedFile,
    isSubmitting,
    handleChange,
    handleFileChange,
    handleSubmit,
  } = useAddBookForm();

  return (
    <PageShell>
      <PageBanner title="Add New Book" />

      <div
        className="authPage"
        style={{
          minHeight: "auto",
          padding: "40px 0",
        }}
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
              type="number"
              min="1"
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

            {/*
            ===============================================
            בחירת תמונת כריכה
            ===============================================
            */}

            <div className="formGroup">
              <label className="label" htmlFor="book-cover-upload">
                Book Cover Image
              </label>

              <input
                type="file"
                id="book-cover-upload"
                onChange={handleFileChange}
                accept="image/*"
                required
                style={{ display: "none" }}
              />

              <label
                htmlFor="book-cover-upload"
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

            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Adding Book..." : "Add Book to Catalog"}
            </Button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
