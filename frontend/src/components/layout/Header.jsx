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

הערה:
תמונת הפרופיל נטענת מתוך תיקיית uploads בשרת.
=========================================================
*/

import { Link, NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

/*
---------------------------------------------------------
בניית כתובת תמונת הפרופיל

תפקיד:
מחזירה את כתובת התמונה המתאימה למשתמש.

אם קיימת תמונה בשרת:
יוצג הקובץ מתוך uploads.

אם לא קיימת תמונה:
תוצג תמונת ברירת מחדל.
---------------------------------------------------------
*/
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
  const { user, isAuthenticated, logout } = useAuth();

  /*
  ---------------------------------------------------------
  עיצוב קישור ניווט פעיל

  תפקיד:
  מוסיף class שונה לקישור של הדף הפעיל.
  ---------------------------------------------------------
  */
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
