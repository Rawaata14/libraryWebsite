/*
=========================================================
UsersManagementPage.jsx

תיאור הקובץ:
דף ניהול משתמשים עבור הספרן.

הקובץ כולל:
- שליפת משתמשים מהשרת.
- הצגת משתמשים בטבלה.
- חיפוש לפי שם או אימייל.
- סינון לפי role.
- שינוי סטטוס משתמש.
=========================================================
*/

import { useEffect, useState } from "react";
import PageShell from "../components/layout/PageShell";
import PageBanner from "../components/layout/PageBanner";
import "../styles/users-management.css";

/*
---------------------------------------------------------
UsersManagementPage

תפקיד:
מציג לספרן את כל המשתמשים במערכת ומאפשר ניהול בסיסי.
---------------------------------------------------------
*/
export default function UsersManagementPage() {
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  /*
  ---------------------------------------------------------
  fetchUsers

  תפקיד:
  שולף את רשימת המשתמשים מהשרת.
  ---------------------------------------------------------
  */
  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:8000/user/all", {
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Fetch users error:", error);
    }
  };

  /*
  ---------------------------------------------------------
  handleStatusChange

  תפקיד:
  משנה סטטוס משתמש בין active / blocked.
  ---------------------------------------------------------
  */
  const handleStatusChange = async (email, status) => {
    try {
      const response = await fetch("http://localhost:8000/user/status", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, status }),
      });

      const data = await response.json();

      if (data.success) {
        fetchUsers();
      } else {
        alert(data.message || "Failed to update user status");
      }
    } catch (error) {
      console.error("Update user status error:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchText.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <PageShell>
      <PageBanner title="Users Management" />

      <div className="usersManagementContainer">
        <div className="usersManagementCard">
          <div className="usersSummary">
            <h3>Total Users: {users.length}</h3>

            <div className="usersCounters">
              <span>
                Readers: {users.filter((user) => user.role === "reader").length}
              </span>

              <span>
                Librarians:{" "}
                {users.filter((user) => user.role === "librarian").length}
              </span>

              <span>
                Active:{" "}
                {users.filter((user) => user.status === "active").length}
              </span>
            </div>
          </div>
          <div className="usersToolbar">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="reader">Readers</option>
              <option value="librarian">Librarians</option>
            </select>
          </div>

          <div className="usersTableWrapper">
            <table className="usersTable">
              <thead>
                <tr>
                  <th>Profile</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.email}>
                    <td>
                      <img
                        className="userProfileImage"
                        src={
                          user.profile_image_name
                            ? `http://localhost:8000/uploads/profile-images/${user.profile_image_name}`
                            : "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                        }
                        alt={user.fullName}
                      />
                    </td>
                    <td>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>{user.phone || "-"}</td>
                    <td>{user.role}</td>
                    <td>
                      <span
                        className={`userStatus ${
                          user.status === "active"
                            ? "statusActive"
                            : "statusBlocked"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td>
                      {user.status === "active" ? (
                        <button
                          type="button"
                          className="blockUserButton"
                          onClick={() =>
                            handleStatusChange(user.email, "blocked")
                          }
                        >
                          Block
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="activateUserButton"
                          onClick={() =>
                            handleStatusChange(user.email, "active")
                          }
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <p className="emptyUsersText">No users found.</p>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
