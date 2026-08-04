/*
  PageShell.jsx
  -------------
  מעטפת כללית לכל דפי המערכת.

  אחריות:
  - להציג Header ו־Footer קבועים
  - לעטוף את תוכן הדף
  - לשמור על עיצוב אחיד בכל המערכת
*/

import Header from "./Header";
import Footer from "./Footer";

export default function PageShell({
  children,
  userType = "guest",
  userName,
}) {
  const resolvedUserName = userName || (userType === "guest" ? "Guest" : "User"); // ברירת מחדל לשם המשתמש אם לא סופק
  return (
    <div className="pageShell">
      <div className="frame libraryBg">
        <Header userType={userType} userName={resolvedUserName} />
        {children}
        <Footer />
      </div>
    </div>
  );
}
