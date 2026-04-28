/*
  Header.jsx
  ----------
  סרגל ניווט עליון של המערכת.

  אחריות:
  - מעבר בין דפים
  - הצגת מצב משתמש (אורח / מחובר)
  - מתן אפשרות להתנתקות
*/

import { NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  const navClassName = ({ isActive }) =>
    isActive ? "navItem activeNav" : "navItem";

  return (
    <header className="topbar">
      <NavLink to="/" className="brand">
        <span className="brandIcon">📖</span>
        <span>Library</span>
      </NavLink>

      <nav className="navLinks">
        <NavLink to="/" className={navClassName}>
          Home
        </NavLink>

        <NavLink to="/map" className={navClassName}>
          Study Rooms
        </NavLink>

        <NavLink to="/books" className={navClassName}>
          Books
        </NavLink>

        <NavLink to="/events" className={navClassName}>
          Events
        </NavLink>

        <NavLink to="/about" className={navClassName}>
          About Us
        </NavLink>
      </nav>

      <div className="headerActions">
        {!isAuthenticated ? (
          <NavLink to="/login" className="headerLoginBtn">
            Login / Sign Up
          </NavLink>
        ) : (
          <>
            <div className="userChip">Welcome {user.fullName}</div>

            <button type="button" className="headerLogoutBtn" onClick={logout}>
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
