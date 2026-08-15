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
import UserRow from "../components/users/UserRow";
import "../styles/users-management.css";

import { getAllUsers, updateUserStatus } from "../services/userService";

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
שולפת את רשימת המשתמשים דרך userService
ומעדכנת את הרשימה המקומית.
---------------------------------------------------------
*/
  const fetchUsers = async () => {
    try {
      const response = await getAllUsers();

      if (response.data.success) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      console.error("Fetch users error:", error);
    }
  };

  /*
---------------------------------------------------------
handleStatusChange

תפקיד:
משנה סטטוס משתמש ומרעננת את הרשימה
לאחר עדכון מוצלח.
---------------------------------------------------------
*/
  const handleStatusChange = async (email, status) => {
    try {
      const response = await updateUserStatus(email, status);

      if (response.data.success) {
        await fetchUsers();
        return;
      }

      window.alert(response.data.message || "Failed to update user status");
    } catch (error) {
      console.error("Update user status error:", error);

      window.alert(
        error.response?.data?.message || "Failed to update user status",
      );
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
                  <UserRow
                    key={user.userId || user.id || user.email}
                    user={user}
                    onStatusChange={handleStatusChange}
                  />
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
