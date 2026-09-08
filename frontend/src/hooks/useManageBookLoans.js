/*
=========================================================
useManageBookLoans.js

תיאור הקובץ:
Custom Hook המרכז את הלוגיקה של ניהול השאלות הספרים עבור הספרן.
=========================================================
*/

import { useState, useEffect, useCallback } from "react";
import { getLibrarianDashboardStats } from "../services/dashboardService";
import axios from "axios";
import { buildApiUrl } from "../config/api";

export default function useManageBookLoans() {
  const [loans, setLoans] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchLoans = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await getLibrarianDashboardStats();
      const responseData = response.data;

      if (responseData.success) {
        setLoans(responseData.stats?.activeLoansList || []);
      } else {
        setErrorMessage(responseData.message || "Failed to load book loans.");
      }
    } catch (error) {
      console.error("Error fetching book loans:", error);
      setErrorMessage("Network error while loading loans.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  /*
  ---------------------------------------------------------
  handleReturnBook

  תפקיד:
  שולח בקשה לעדכון סטטוס ההשאלה ל-'returned' בלחיצת כפתור
  ومעדכן את הרשימה באופן דינמי.
  ---------------------------------------------------------
  */
  const handleReturnBook = async (loanId) => {
    setErrorMessage("");
    setSuccessMessage("");

    console.log("Attempting to return loan with ID:", loanId);
    console.log(
      "Target URL:",
      buildApiUrl(`/api/librarian/loans/${loanId}/return`),
    );

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
