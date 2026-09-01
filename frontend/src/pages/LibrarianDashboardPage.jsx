/*
=========================================================
LibrarianDashboardPage.jsx

תיאור הקובץ:
דף הדשבורד הראשי של הספרנית.

העמוד אחראי על:
- הצגת הזמנות היום לפי חלונות זמן.
- הצגת נתוני הספרייה המרכזיים.
- הצגת הפעילות היומית האחרונה.
- אפשרות לרענן את הנתונים.

כל הנתונים מתקבלים דרך:
useLibrarianDashboard
=========================================================
*/

import PageShell from "../components/layout/PageShell";

import useLibrarianDashboard from "../hooks/useLibrarianDashboard";

import "../styles/librarianDashboard.css";

import { formatReservationDate } from "../utils/reservationUtils";

/*
---------------------------------------------------------
LibrarianDashboardPage

תפקיד:
מציגה את נתוני דשבורד הספרנית ממקור הנתונים
המשותף של המערכת.
---------------------------------------------------------
*/
export default function LibrarianDashboardPage() {
  const { stats, isLoading, errorMessage, fetchDashboardStats } =
    useLibrarianDashboard();

  return (
    <PageShell hideSidebar={true}>
      <div className="dashboard-page-wrapper">
        <header className="dashboard-header">
          <div>
            <h1 className="h1">Librarian Dashboard</h1>
            <p className="p">Library activity and management overview</p>
          </div>

          <button
            type="button"
            className="dashboardRefreshButton"
            onClick={fetchDashboardStats}
            disabled={isLoading}
          >
            {isLoading ? "Refreshing..." : "Refresh Data"}
          </button>
        </header>

        {errorMessage && (
          <div className="errorMessage" role="alert">
            <p>{errorMessage}</p>

            <button type="button" onClick={fetchDashboardStats}>
              Try Again
            </button>
          </div>
        )}

        {isLoading ? (
          <p className="dashboardLoadingMessage" role="status">
            Loading dashboard data...
          </p>
        ) : (
          <div className="librarianDashboardContainer">
            {/*
            ===============================================
            הזמנות היום לפי חלון זמן
            ===============================================
            */}

            <section className="dashboard-card">
              <h2>Today Reservations</h2>

              <div className="card-content">
                <div className="reservations-table-container">
                  <table className="reservations-mini-table">
                    <caption className="visuallyHidden">
                      Today&apos;s reservations by time slot
                    </caption>

                    <thead>
                      <tr>
                        <th scope="col">Time Slot</th>
                        <th scope="col">Booked</th>
                        <th scope="col">Available</th>
                      </tr>
                    </thead>

                    <tbody>
                      {stats.hourlyReservations.map((slot) => (
                        <tr key={`${slot.startTime}-${slot.endTime}`}>
                          <td>
                            <span className="time-text">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </td>

                          <td>
                            <span className="badge-booked">{slot.booked}</span>
                          </td>

                          <td>
                            <span className="badge-available">
                              {slot.available}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="todayReservationsTotal">
                  Total reservations today:{" "}
                  <strong>{stats.todayReservations}</strong>
                </p>
              </div>
            </section>

            {/*
            ===============================================
            נתוני הספרייה המרכזיים - Active Loans
            ===============================================
            */}

            <section className="dashboard-card">
              <h2>Active Loans</h2>

              <div className="card-content">
                <div className="reservations-table-container">
                  <table className="reservations-mini-table">
                    <caption className="visuallyHidden">
                      Active book loans list
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Book Title</th>
                        <th scope="col">Time Slot</th>
                        <th scope="col">Available Copies</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.activeLoansList &&
                      stats.activeLoansList.length > 0 ? (
                        stats.activeLoansList.map((loan) => (
                          <tr key={loan.loanId}>
                            <td>{loan.bookTitle || loan.book?.title}</td>
                            <td>
                              <span className="time-text">
                                {loan.startTime && loan.endTime
                                  ? `${loan.startTime} - ${loan.endTime}`
                                  : "-"}
                              </span>
                            </td>
                            <td>
                              {loan.availableQuantity ??
                                loan.book?.available_quantity ??
                                "-"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="4"
                            style={{ textAlign: "center", padding: "1rem" }}
                          >
                            No active book loans for today.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <p
                  className="todayReservationsTotal"
                  style={{ marginTop: "1rem" }}
                >
                  Total active loans: <strong>{stats.activeLoans}</strong>
                </p>
              </div>
            </section>

            <section className="dashboard-card">
              <h2>Overdue Books</h2>

              <div className="card-content">
                <strong className="dashboardMainValue">
                  {stats.overdueBooks}
                </strong>
              </div>
            </section>

            <section className="dashboard-card">
              <h2>Unread Messages</h2>

              <div className="card-content">
                <strong className="dashboardMainValue">
                  {stats.unreadMessages}
                </strong>
              </div>
            </section>

            <section className="dashboard-card">
              <h2>Blocked Seats</h2>

              <div className="card-content">
                <strong className="dashboardMainValue">
                  {stats.blockedSeats}
                </strong>
              </div>
            </section>

            {/*
            ===============================================
            פעילות היום
            ===============================================
            */}

            <section className="dashboard-card">
              <h2>Today&apos;s Activity</h2>

              <div className="card-content">
                {stats.todayActivity.length > 0 ? (
                  <ul className="dashboardActivityList">
                    {stats.todayActivity.map((activity, index) => (
                      <li key={`${activity}-${index}`}>{activity}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No activity today.</p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </PageShell>
  );
}
