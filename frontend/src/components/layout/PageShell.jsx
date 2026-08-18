/*
=========================================================
PageShell.jsx

תיאור הקובץ:
מעטפת משותפת לכל דפי המערכת.

הקומפוננטה אחראית על:
- הצגת Header קבוע.
- הצגת סרגל ספרנית למשתמשת מורשית.
- הצגת כפתור חזרה בדפים פנימיים.
- הצגת תוכן הדף.
- הצגת Footer קבוע.
=========================================================
*/

import { useContext } from "react";
import PropTypes from "prop-types";
import { useLocation } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";

import BackButton from "../common/BackButton";
import Footer from "./Footer";
import Header from "./Header";
import LibrarianSidebar from "./LibrarianSidebar";

/*
---------------------------------------------------------
PAGES_WITHOUT_BACK_BUTTON

תפקיד:
מגדיר את העמודים הראשיים שבהם אין צורך
להציג כפתור חזרה.
---------------------------------------------------------
*/
const PAGES_WITHOUT_BACK_BUTTON = [
  "/",
  "/admin/librarian",
  "/login",
  "/register",
];

/*
---------------------------------------------------------
PageShell

תפקיד:
עוטפת את תוכן הדף בין ה-Header ל-Footer,
מציגה סרגל ספרנית וכפתור חזרה בדפים פנימיים.
---------------------------------------------------------
*/
export default function PageShell({ children }) {
  const { isLibrarian } = useContext(AuthContext);
  const location = useLocation();

  const shouldShowBackButton = !PAGES_WITHOUT_BACK_BUTTON.includes(
    location.pathname,
  );

  return (
    <div className="pageShell">
      <div className="frame libraryBg">
        <Header />

        <div className="pageShellBody">
          {isLibrarian && <LibrarianSidebar />}

          <main className="pageShellContent">
            {shouldShowBackButton && (
              <div className="pageBackButtonContainer">
                <BackButton variant="page" />
              </div>
            )}

            {children}
          </main>
        </div>

        <Footer />
      </div>
    </div>
  );
}

/*
---------------------------------------------------------
PageShell.propTypes

תפקיד:
מגדיר את תוכן הדף שמתקבל בתוך המעטפת.
---------------------------------------------------------
*/
PageShell.propTypes = {
  children: PropTypes.node.isRequired,
};
