/*
=========================================================
Footer.jsx

תיאור הקובץ:
אזור תחתית הדף המשותף לכל דפי המערכת.

הקומפוננטה אחראית על:
- הצגת פרטי קשר.
- הצגת שמות הרשתות החברתיות.
- הצגת קישורים נגישים לדוא"ל ולטלפון.
=========================================================
*/

import "../../styles/footer.css";

/*
---------------------------------------------------------
Footer

תפקיד:
מציגה את פרטי הקשר של הספרייה בתחתית
כל דפי המערכת.
---------------------------------------------------------
*/
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footerRow">
        {/*
        ================================================
        רשתות חברתיות

        בשלב זה מוצגים שמות הרשתות בלבד.
        ניתן להחליף אותם בקישורים כאשר יהיו
        כתובות אמיתיות לעמודי הספרייה.
        ================================================
        */}

        <div className="socials" aria-label="Library social networks">
          <span className="socialBadge" title="Facebook" aria-label="Facebook">
            f
          </span>

          <span
            className="socialBadge"
            title="Instagram"
            aria-label="Instagram"
          >
            ig
          </span>

          <span className="socialBadge" title="LinkedIn" aria-label="LinkedIn">
            in
          </span>
        </div>

        {/*
        ================================================
        פרטי קשר
        ================================================
        */}

        <address className="footerContact">
          <a className="footerContactItem" href="mailto:info@library.com">
            <span aria-hidden="true">✉</span>
            <span>info@library.com</span>
          </a>

          <a className="footerContactItem" href="tel:031234567">
            <span aria-hidden="true">📞</span>
            <span>03-1234567</span>
          </a>

          <span className="footerContactItem">
            <span aria-hidden="true">📍</span>
            <span>Library Main Branch</span>
          </span>
        </address>
      </div>
    </footer>
  );
}
