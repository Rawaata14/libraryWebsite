import React from "react";
import Header from "../components/layout/Header";
import "../styles/librarianDashboard.css";
import useManageReservations from "../hooks/useManageReservations";

const LibrarianDashboardPage = () => {
  const {
    todayReservationsCount,
    activeReservationsCount,
    isLoading,
    errorMessage,
  } = useManageReservations();

  if (isLoading) {
    return <div>Loading dashboard data...</div>;
  }
  if (errorMessage) {
    return <div className="errorMessage">{errorMessage}</div>;
  }

  return (
    <>
      {/* סרגל הניווט העליון של המערכת */}
      <Header />

      <div className="dashboard-page-wrapper">
        <header className="dashboard-header">
          <h1>Librarian Dashboard</h1>
        </header>

        <div className="librarianDashboardContainer">
          {/* Today Reservations */}
          <div className="dashboard-card">
            <h3>Today Reservations</h3>
            <div className="card-content">
              <div className="reservations-table-container">
                <table className="reservations-mini-table">
                  <thead>
                    <tr>
                      <th>Time Slot</th>
                      <th>Booked</th>
                      <th>Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hourlyReservations.map((slot, index) => (
                      <tr
                        key={index}
                        onClick={() =>
                          console.log(`Clicked slot: ${slot.time}`)
                        }
                      >
                        <td>
                          <span className="time-text">{slot.time}</span>
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
            </div>
          </div>

          {/* Active Loans */}
          <div className="dashboard-card">
            <h3>Active Loans</h3>
            <div className="card-content">
              <p>{activeReservationsCount}</p>
            </div>
          </div>

          {/* Overdue Books */}
          <div className="dashboard-card">
            <h3>Overdue Books</h3>
            <div className="card-content">
              <p>-</p>
            </div>
          </div>

          {/* Unread Messages */}
          <div className="dashboard-card">
            <h3>Unread Messages</h3>
            <div className="card-content">
              <p>-</p>
            </div>
          </div>

          {/* Blocked Seats */}
          <div className="dashboard-card">
            <h3>Blocked Seats</h3>
            <div className="card-content">
              <p>-</p>
            </div>
          </div>

          {/* Today's Activity */}
          <div className="dashboard-card">
            <h3>Today's Activity</h3>
            <div className="card-content">
              <p>-</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LibrarianDashboardPage;
