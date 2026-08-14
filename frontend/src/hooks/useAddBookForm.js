/*
=========================================================
useAddBookForm.js

תיאור הקובץ:
Custom Hook לניהול טופס הוספת ספר חדש.

ה-Hook אחראי על:
- שמירת ערכי הטופס.
- בחירת תמונת כריכה.
- אימות הכמות ושנת הפרסום.
- בניית FormData.
- שליחת הספר לשרת ואיפוס הטופס.
=========================================================
*/

import { useState } from "react";

import { addBook } from "../services/bookService";

/*
---------------------------------------------------------
initialBookForm

תפקיד:
מגדיר את ערכי ברירת המחדל של טופס הספר.
---------------------------------------------------------
*/
const initialBookForm = {
  isbn: "",
  title: "",
  author: "",
  publishYear: "",
  status: "available",
  category: "",
  quantity: 1,
};

/*
---------------------------------------------------------
useAddBookForm

תפקיד:
מספק לדף הוספת הספר את נתוני הטופס
ואת פעולות העדכון והשליחה.
---------------------------------------------------------
*/
export default function useAddBookForm() {
  const [formData, setFormData] = useState(initialBookForm);

  const [selectedFile, setSelectedFile] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  /*
  ---------------------------------------------------------
  handleChange

  תפקיד:
  מעדכנת שדה בטופס ושומרת שכמות הספרים
  לא תרד מתחת ל-1.
  ---------------------------------------------------------
  */
  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "quantity") {
      const numericValue = Number.parseInt(value, 10);

      setFormData((previousFormData) => ({
        ...previousFormData,
        quantity:
          Number.isNaN(numericValue) || numericValue < 1 ? 1 : numericValue,
      }));

      return;
    }

    setFormData((previousFormData) => ({
      ...previousFormData,
      [name]: value,
    }));
  };

  /*
  ---------------------------------------------------------
  handleFileChange

  תפקיד:
  שומרת את קובץ תמונת הכריכה שנבחר.
  ---------------------------------------------------------
  */
  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    setSelectedFile(file);
  };

  /*
  ---------------------------------------------------------
  resetForm

  תפקיד:
  מחזירה את הטופס והקובץ לערכי ברירת המחדל.
  ---------------------------------------------------------
  */
  const resetForm = () => {
    setFormData(initialBookForm);
    setSelectedFile(null);
  };

  /*
  ---------------------------------------------------------
  handleSubmit

  תפקיד:
  מאמתת את נתוני הספר, בונה FormData,
  שולחת את הספר לשרת ומאפסת את הטופס.
  ---------------------------------------------------------
  */
  const handleSubmit = async (event) => {
    event.preventDefault();

    const publishYear = Number.parseInt(formData.publishYear, 10);

    if (formData.quantity < 1) {
      window.alert("Quantity must be at least 1");
      return;
    }

    if (Number.isNaN(publishYear)) {
      window.alert("Publish year must be a valid number");
      return;
    }

    if (!selectedFile) {
      window.alert("Please select a book cover image");
      return;
    }

    const bookData = new FormData();

    bookData.append("isbn", formData.isbn);
    bookData.append("title", formData.title);
    bookData.append("author", formData.author);
    bookData.append("category", formData.category);
    bookData.append("publishYear", publishYear);
    bookData.append("status", formData.status);
    bookData.append("quantity", formData.quantity);
    bookData.append("image", selectedFile);

    try {
      setIsSubmitting(true);

      const response = await addBook(bookData);

      window.alert(response.data.message || "Book added successfully!");

      if (response.status === 200 || response.status === 201) {
        resetForm();
      }
    } catch (error) {
      console.error("Error adding book:", error);

      window.alert(
        error.response?.data?.message ||
          "An error occurred while adding the book.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    selectedFile,
    isSubmitting,
    handleChange,
    handleFileChange,
    handleSubmit,
  };
}
