/*
  Footer.jsx
  ----------
  תחתית הדף של המערכת.

  אחריות:
  - הצגת פרטי קשר
  - הצגת רשתות חברתיות
  - שמירה על אחידות עיצובית בכל הדפים
*/

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footerRow">
        <div className="socials">
          <span className="socialBadge">f</span>
          <span className="socialBadge">ig</span>
          <span className="socialBadge">in</span>
        </div>

        <div className="footerContact">
          <span>✉ info@library.com</span>
          <span>📞 03-1234567</span>
          <span>📍 Library Main Branch</span>
        </div>
      </div>
    </footer>
  );
}
