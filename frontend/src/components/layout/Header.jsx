/*
  Header.jsx
  ----------
  סרגל ניווט עליון של המערכת.

  אחריות:
  - מעבר בין דפים
  - הצגת מצב משתמש (אורח / מחובר)
  - מתן אפשרות להתנתקות
*/
import { useContext } from "react";
import { Link } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function Header() {
  const { user, isAuthenticated, isLibrarian, logout } =
    useContext(AuthContext);
  console.log(
    "Header component - user:",
    user,
    "isAuthenticated:",
    isAuthenticated,
    "isLibrarian:",
    isLibrarian,
  );
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
        <NavLink
          to={isLibrarian ? "/admin/map" : "/map"}
          className={navClassName}
        >
          Study Rooms
        </NavLink>
        <NavLink
          to={isLibrarian ? "/admin/books" : "/books"}
          className={navClassName}
        >
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
            <div className="headerProfileSection">
              <span className="headerWelcomeText">
                Welcome {user?.fullName || user?.name}
              </span>

              <Link to="/profile" className="profileImageLink">
                <img
                  src={
                    user?.profileImage ||
                    "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                  }
                  alt="Profile"
                  className="headerProfileImage"
                />
              </Link>
            </div>

            <button type="button" className="headerLogoutBtn" onClick={logout}>
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
