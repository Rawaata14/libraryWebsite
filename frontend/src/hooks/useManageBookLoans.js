/*
=========================================================
useManageBookLoans.js

תיאור הקובץ:
Custom Hook המרכז את הלוגיקה של ניהול השאלות הספרים עבור הספרן,
כולל תמיכה בסינון מתקדם לפי תאריך ושעה מול השרת.
=========================================================
*/

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { buildApiUrl } from "../config/api";

export default function useManageBookLoans() {
  const [loans, setLoans] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchLoans = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      // בניית פרמטרים לשאילתת השרת
      const params = {};
      if (selectedDate) params.date = selectedDate;
      if (selectedTime) params.time = selectedTime;

      const response = await axios.get(
        buildApiUrl("/api/librarian/all-loans"),
        {
          params,
          withCredentials: true,
        },
      );
      const responseData = response.data;

      if (responseData.success) {
        setLoans(responseData.loans || []);
      } else {
        setErrorMessage(responseData.message || "Failed to load book loans.");
      }
    } catch (error) {
      console.error("Error fetching book loans:", error);
      setErrorMessage("Network error while loading loans.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, selectedTime]);

  // טעינה מחדש בכל פעם שהתאריך או השעה משתנים
  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  /*
  ---------------------------------------------------------
  handleReturnBook

  תפקיד:
  שולח בקשה לעדכון סטטוס ההשאלה ל-'returned' בלחיצת כפתור
  ומעדכן את הרשימה באופן דינמי.
  ---------------------------------------------------------
  */
  const handleReturnBook = async (loanId) => {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await axios.patch(
        buildApiUrl(`/api/librarian/loans/${loanId}/return`),
        {},
        {
          withCredentials: true,
        },
      );

      const data = response.data;

      if (data.success) {
        setSuccessMessage("Book successfully returned to inventory.");
        setLoans((prevLoans) =>
          prevLoans.filter((loan) => (loan.loanId || loan.id) !== loanId),
        );
      } else {
        setErrorMessage(data.message || "Failed to return the book.");
      }
    } catch (error) {
      console.error("Error returning book:", error);
      setErrorMessage("Network error while returning the book.");
    }
  };

  // סינון טקסטואלי וסטטוס מתבצע מקומית על התוצאות שהוחזרו מהשרת
  const filteredLoans = loans.filter((loan) => {
    const matchesSearch =
      loan.bookTitle?.toLowerCase().includes(searchText.toLowerCase()) ||
      loan.userName?.toLowerCase().includes(searchText.toLowerCase()) ||
      loan.fullName?.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || loan.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeLoansCount = loans.filter(
    (loan) => loan.status === "active",
  ).length;
  const overdueLoansCount = loans.filter(
    (loan) => loan.status === "late",
  ).length;

  return {
    loans,
    filteredLoans,
    searchText,
    setSearchText,
    statusFilter,
    setStatusFilter,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    isLoading,
    errorMessage,
    clearErrorMessage: () => setErrorMessage(""),
    successMessage,
    clearSuccessMessage: () => setSuccessMessage(""),
    fetchLoans,
    activeLoansCount,
    overdueLoansCount,
    handleReturnBook,
  };
}
