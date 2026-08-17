/*
=========================================================
PageShell.jsx

תיאור הקובץ:
מעטפת משותפת לכל דפי המערכת.

הקומפוננטה אחראית על:
- הצגת Header קבוע.
- הצגת סרגל ספרנית למשתמשת מורשית.
- הצגת תוכן הדף.
- הצגת Footer קבוע.
=========================================================
*/

import { useContext } from "react";
import PropTypes from "prop-types";

import { AuthContext } from "../../context/AuthContext";

import Footer from "./Footer";
import Header from "./Header";
import LibrarianSidebar from "./LibrarianSidebar";

/*
---------------------------------------------------------
PageShell

תפקיד:
עוטפת את תוכן הדף בין ה-Header ל-Footer
ומציגה סרגל ניהול אנכי עבור ספרנית.
---------------------------------------------------------
*/
export default function PageShell({ children }) {
  const { isLibrarian } = useContext(AuthContext);

  return (
    <div className="pageShell">
      <div className="frame libraryBg">
        <Header />

        <div className="pageShellBody">
          {isLibrarian && <LibrarianSidebar />}

          <main className="pageShellContent">{children}</main>
        </div>

        <Footer />
      </div>
    </div>
  );
}

PageShell.propTypes = {
  children: PropTypes.node.isRequired,
};
