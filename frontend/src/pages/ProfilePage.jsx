/*
  ProfilePage.jsx
  ----------------
  דף פרופיל ראשי.

  אחריות:
  - זיהוי המשתמש המחובר
  - הצגת דשבורד לפי role
*/

import { useContext } from "react";
import { AuthContext } from "../../src/context/AuthContext";

export default function ProfilePage() {
  const { user } = useContext(AuthContext);

  const isLibrarian = user?.role === "librarian";

  return (
    <div className="profilePage">
      <div className="profileCard">
        <div className="profileHeader">
          <img
            src={
              user?.profileImage ||
              "https://cdn-icons-png.flaticon.com/512/847/847969.png"
            }
            alt="Profile"
            className="profileImage"
          />

          <div>
            <h1>{user?.fullName || user?.name || "Library User"}</h1>

            <p>{user?.email}</p>

            <span className="profileRole">
              {isLibrarian ? "Librarian" : "User"}
            </span>
          </div>
        </div>

        {!isLibrarian ? (
          <div className="profileSection">
            <h2>My Activity</h2>

            <div className="profileGrid">
              <div className="profileBox">
                <h3>Borrowed Books</h3>
                <p>3 Active Books</p>
              </div>

              <div className="profileBox">
                <h3>Reservations</h3>
                <p>2 Active Reservations</p>
              </div>

              <div className="profileBox">
                <h3>Notifications</h3>
                <p>No New Notifications</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="profileSection">
            <h2>Librarian Dashboard</h2>

            <div className="profileGrid">
              <div className="profileBox">
                <h3>Manage Books</h3>
                <p>Add / Edit / Remove Books</p>
              </div>

              <div className="profileBox">
                <h3>Manage Seats</h3>
                <p>Control Library Map</p>
              </div>

              <div className="profileBox">
                <h3>Users Management</h3>
                <p>Manage Library Users</p>
              </div>

              <div className="profileBox">
                <h3>Reports</h3>
                <p>Library Statistics & Reports</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
