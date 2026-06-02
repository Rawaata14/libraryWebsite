/*
=========================================================
Header.jsx

תיאור הקובץ:
סרגל הניווט העליון של המערכת.

הקובץ כולל:
- ניווט בין דפי המערכת.
- הצגת משתמש מחובר.
- הצגת תמונת פרופיל.
- מעבר לדף הפרופיל.
- התנתקות מהמערכת.
=========================================================
*/

import { Link, NavLink } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

function getProfileImage(user) {
  if (user?.profile_image_name) {
    return `http://localhost:8000/uploads/profile-images/${user.profile_image_name}`;
  }

  if (user?.profileImage) {
    return user.profileImage;
  }

  return "https://cdn-icons-png.flaticon.com/512/847/847969.png";
}

export default function Header() {
 const { user, isAuthenticated, isLibrarian, logout } = useContext(AuthContext);

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
                  src={getProfileImage(user)}
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
