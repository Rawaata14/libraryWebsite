import { useMemo } from "react";
import Header from "../components/layout/Header";
import "../styles/librarianDashboard.css";
import useManageReservations from "../hooks/useManageReservations";

/*
---------------------------------------------------------
reservationTimeSlots

תפקיד:
מגדיר את חלונות ההזמנה היומיים של הספרייה.
---------------------------------------------------------
*/
const reservationTimeSlots = [
  { startTime: "08:00", endTime: "10:00" },
  { startTime: "10:00", endTime: "12:00" },
  { startTime: "12:00", endTime: "14:00" },
  { startTime: "14:00", endTime: "16:00" },
  { startTime: "16:00", endTime: "18:00" },
  { startTime: "18:00", endTime: "20:00" },
];

const LibrarianDashboardPage = () => {
  const {
    reservations,
    todayReservationsCount,
    isLoading,
    errorMessage,
  } = useManageReservations();

  /*
---------------------------------------------------------
hourlyReservations

תפקיד:
מחשב כמה הזמנות פעילות קיימות היום
בכל אחד מחלונות ההזמנה המוגדרים.
---------------------------------------------------------
*/
  const hourlyReservations = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];

    return reservationTimeSlots.map((slot) => {
      const booked = reservations.filter((reservation) => {
        const reservationDate = String(reservation.reservationDate || "").split(
          "T",
        )[0];

        const reservationStartTime = String(reservation.startTime || "").slice(
          0,
          5,
        );

        const reservationEndTime = String(reservation.endTime || "").slice(
          0,
          5,
        );

        const status = String(reservation.status || "").toLowerCase();

        return (
          reservationDate === today &&
          reservationStartTime === slot.startTime &&
          reservationEndTime === slot.endTime &&
          status !== "cancelled"
        );
      }).length;

      return {
        time: `${slot.startTime} - ${slot.endTime}`,
        booked,
        available: "-",
      };
    });
  }, [reservations]);

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

              <p className="todayReservationsTotal">
                Total reservations today: {todayReservationsCount}
              </p>
            </div>
          </div>

          {/* Active Loans */}
          <div className="dashboard-card">
            <h3>Active Loans</h3>
            <div className="card-content">
              <p>-</p>
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
            <h3>Today&apos;s Activity</h3>
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
