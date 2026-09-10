/*
=========================================================
ManageBookLoansPage.jsx

תיאור הקובץ:
דף ניהול השאלות הספרים עבור הספרנית, כולל סינון מתקדם לפי תאריך ושעה.
=========================================================
*/

import PageShell from "../components/layout/PageShell";
import PageBanner from "../components/layout/PageBanner";

import LoansFilters from "../components/loans/LoansFilters";
import LoansSummary from "../components/loans/LoansSummary";
import BookLoansTable from "../components/loans/BookLoansTable";
import useManageBookLoans from "../hooks/useManageBookLoans";

import "../styles/manage-book-loans.css";

export default function ManageBookLoansPage() {
  const {
    loans,
    filteredLoans,
    isLoading,
    errorMessage,
    successMessage,
    clearErrorMessage,
    clearSuccessMessage,
    fetchLoans,
    searchText,
    setSearchText,
    statusFilter,
    setStatusFilter,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    activeLoansCount,
    overdueLoansCount,
    handleReturnBook,
  } = useManageBookLoans();

  return (
    <PageShell>
      <PageBanner title="Manage Book Loans" />
      <main className="manageBookLoansPage">
        <section className="manageBookLoansCard">
          <div className="manageBookLoansHeader">
            <div>
              <h2>Manage Book Loans</h2>
              <p>View and manage all book loans</p>
            </div>
            <button
              type="button"
              className="refreshLoansButton"
              onClick={fetchLoans}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {errorMessage && (
            <div className="managementFeedback errorFeedback">
              <span aria-hidden="true">!</span>
              <p>{errorMessage}</p>
              <button type="button" onClick={clearErrorMessage}>
                ×
              </button>
            </div>
          )}

          {successMessage && (
            <div className="managementFeedback successFeedback">
              <span aria-hidden="true">✓</span>
              <p>{successMessage}</p>
              <button type="button" onClick={clearSuccessMessage}>
                ×
              </button>
            </div>
          )}

          <LoansSummary
            totalLoans={loans.length}
            activeLoans={activeLoansCount}
            overdueLoans={overdueLoansCount}
          />

          <LoansFilters
            searchText={searchText}
            statusFilter={statusFilter}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onSearchChange={setSearchText}
            onStatusChange={setStatusFilter}
            onDateChange={setSelectedDate}
            onTimeChange={setSelectedTime}
          />

          <BookLoansTable
            loans={filteredLoans}
            isLoading={isLoading}
            onReturn={handleReturnBook}
          />
        </section>
      </main>
    </PageShell>
  );
}
