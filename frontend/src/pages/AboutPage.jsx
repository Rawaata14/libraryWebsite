/*
  AboutPage.jsx
  -------------
  דף אודות המערכת והספרייה.

  אחריות:
  - להציג מידע כללי על מטרת המערכת
  - להציג רקע קצר על הספרייה
  - לשמור על דף תדמיתי ברור ומסודר

  הערה:
  בהמשך ניתן למשוך חלק מהמידע הזה מהשרת אם נרצה לנהל תוכן דינמי.
*/

import PageShell from "../components/layout/PageShell";
import PageBanner from "../components/layout/PageBanner";

export default function AboutPage() {
  return (
    <PageShell userType="guest">
      <PageBanner title="About Us" />

      <div className="aboutPageContainer">
        <div className="aboutPageCard">
          <div className="aboutHeroImage">
            <img
              src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1400&q=80"
              alt="Library interior"
            />
          </div>

          <div className="aboutContent">
            <h2>About the Library Reservation System</h2>

            <p>
              The Library Reservation System was designed to improve the study
              experience for students by providing an organized and digital way
              to reserve study spaces and books.
            </p>

            <p>
              The system helps reduce crowding, prevents seat occupation without
              actual use, and allows students to plan their time more
              efficiently.
            </p>

            <h3>System Goals</h3>
            <ul>
              <li>Allow users to reserve study rooms and seats online</li>
              <li>Provide access to book reservation and availability</li>
              <li>
                Support librarians in managing seats, books, and reservations
              </li>
              <li>
                Improve user experience through a simple and clear interface
              </li>
            </ul>

            <h3>Why This Project Matters</h3>
            <p>
              In many libraries, seats are often taken without active use, and
              book availability is not always tracked efficiently. This project
              offers a practical solution that combines seat reservation, book
              reservation, and management tools in one unified system.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
