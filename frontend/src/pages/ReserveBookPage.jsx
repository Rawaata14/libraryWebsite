/*
  ReserveBookPage.jsx
  ------------------
  דף שריון ספר.

  אחריות:
  - לקבל את פרטי הספר שנבחר מהעמוד הקודם
  - להציג מסך שריון מעוצב למשתמש
  - בהמשך יתחבר לשרת ולבסיס הנתונים
*/

import { useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import PageShell from "../components/layout/PageShell";
import PageBanner from "../components/layout/PageBanner";
import Button from "../components/common/Button";

export default function ReserveBookPage() {
  const { state: book } = useLocation();
  const { user } = useContext(AuthContext);

  return (
    <PageShell>
      <PageBanner title="Reserve a Book" />

      <div className="reservePage">
        <div className="reserveContainer">
          {!book ? (
            <div className="reserveEmptyState">
              <h2>לא נבחר ספר</h2>
              <p>יש לחזור לרשימת הספרים ולבחור ספר לשריון.</p>
            </div>
          ) : (
            <>
              <div className="reserveSuccess">
                ✔ You have a seat reserved
                <br />
                <span>Today: 14:00 - 16:00</span>
              </div>

              <div className="reserveContent">
                <div className="reserveBook">
                  <img
                    src={
                      book.book_image_name?.startsWith("http")
                        ? book.book_image_name
                        : `http://localhost:8000/uploads/${book.book_image_name}`
                    }
                    alt={book.title}
                  />
                  <h3>Title: {book.title}</h3>
                  <p>by {book.author}</p>
                  <p>Available Copies: {book.available_quantity}</p>
                </div>

                <div className="reserveDetails">
                  <h3>Reservation Details</h3>

                  <p>
                    <strong>Date:</strong> April 26, 2024
                  </p>
                  <p>
                    <strong>Time:</strong> 14:00 - 16:00
                  </p>
                  <p>
                    <strong>User:</strong> {user?.fullName}
                  </p>
                  <p>
                    <strong>Email:</strong> {user?.email}
                  </p>

                  <div className="reserveNote">
                    ⚠ Reservation valid only during seat time
                  </div>

                  <Button variant="primary">Reserve Book</Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
