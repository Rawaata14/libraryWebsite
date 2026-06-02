/*
  AboutPage.jsx
  -------------
  דף אודות מקצועי.

  אחריות:
  - הצגת מידע על מערכת הספרייה
  - מתן אפשרות לספרן לערוך טקסטים בדף
  - הצגת טופס יצירת קשר למשתמשים
  - שליחת הודעה לספרייה דרך mailto

  הערה:
  כרגע העריכה נשמרת זמנית ב-state.
  בהמשך ניתן לחבר אותה ל-backend ולשמור במסד נתונים.
*/

import { useState, useContext } from "react";
import PageShell from "../components/layout/PageShell";
import PageBanner from "../components/layout/PageBanner";
import { AuthContext } from "../../src/context/AuthContext";

export default function AboutPage() {
  const { user } = useContext(AuthContext);

  const isLibrarian = user?.role === "librarian";

  const [isEditing, setIsEditing] = useState(false);

  const [content, setContent] = useState({
    title: "About the Library Reservation System",

    intro:
      "The Library Reservation System was designed to help students, visitors, and librarians manage study spaces and book reservations in a simple, organized, and efficient way.",

    mission:
      "To provide a comfortable digital experience that helps users reserve study rooms, seats, and books without confusion or unnecessary waiting.",

    students:
      "Students can check available seats, reserve a suitable place, and manage their study time more effectively.",

    librarians:
      "Librarians can manage books, reservations, seating areas, and system activity from one clear interface.",
  });

  const [contact, setContact] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleContentChange = (field, value) => {
    setContent((prevContent) => ({
      ...prevContent,
      [field]: value,
    }));
  };

  const handleContactChange = (field, value) => {
    setContact((prevContact) => ({
      ...prevContact,
      [field]: value,
    }));
  };

  const handleSendEmail = (event) => {
    event.preventDefault();

    const subject = encodeURIComponent("Message from Library Website");

    const body = encodeURIComponent(
      `Name: ${contact.name}\nEmail: ${contact.email}\n\nMessage:\n${contact.message}`,
    );

    window.location.href = `mailto:info@library.com?subject=${subject}&body=${body}`;
  };

  return (
    <PageShell userType="guest">
      <PageBanner title="About Us" />

      <div className="aboutPageContainer">
        <div className="aboutPageCard">
          {isLibrarian && (
            <div className="aboutAdminBar">
              <span>Librarian Content Control</span>

              <button
                type="button"
                onClick={() => setIsEditing((prev) => !prev)}
              >
                {isEditing ? "Preview Content" : "Edit Content"}
              </button>
            </div>
          )}

          <section className="aboutIntro">
            <span className="aboutBadge">Library Management System</span>

            {isEditing ? (
              <>
                <input
                  className="aboutEditInput"
                  value={content.title}
                  onChange={(event) =>
                    handleContentChange("title", event.target.value)
                  }
                />

                <textarea
                  className="aboutEditTextarea"
                  value={content.intro}
                  onChange={(event) =>
                    handleContentChange("intro", event.target.value)
                  }
                />
              </>
            ) : (
              <>
                <h2>{content.title}</h2>

                <p>{content.intro}</p>
              </>
            )}
          </section>

          <section className="aboutGrid">
            <div className="aboutInfoBox">
              <h3>Our Mission</h3>

              {isEditing ? (
                <textarea
                  className="aboutEditTextarea"
                  value={content.mission}
                  onChange={(event) =>
                    handleContentChange("mission", event.target.value)
                  }
                />
              ) : (
                <p>{content.mission}</p>
              )}
            </div>

            <div className="aboutInfoBox">
              <h3>For Students</h3>

              {isEditing ? (
                <textarea
                  className="aboutEditTextarea"
                  value={content.students}
                  onChange={(event) =>
                    handleContentChange("students", event.target.value)
                  }
                />
              ) : (
                <p>{content.students}</p>
              )}
            </div>

            <div className="aboutInfoBox">
              <h3>For Librarians</h3>

              {isEditing ? (
                <textarea
                  className="aboutEditTextarea"
                  value={content.librarians}
                  onChange={(event) =>
                    handleContentChange("librarians", event.target.value)
                  }
                />
              ) : (
                <p>{content.librarians}</p>
              )}
            </div>
          </section>

          <section className="aboutContent">
            <h3>System Goals</h3>

            <ul>
              <li>Allow users to reserve study rooms and seats online</li>
              <li>Provide access to book reservation and availability</li>
              <li>Support librarians in managing books and reservations</li>
              <li>Improve the library experience through a clear interface</li>
            </ul>
          </section>

          <section className="contactSection">
            <div className="contactInfo">
              <span className="contactBadge">Need Help?</span>

              <h3>Contact The Library</h3>

              <p>
                Have a question, need help with a reservation, or want to
                contact the librarian? Send a message directly to the library
                staff.
              </p>

              <div className="contactDetails">
                <span>📧 info@library.com</span>
                <span>📞 03-1234567</span>
                <span>📍 Library Main Branch</span>
              </div>
            </div>

            <form className="contactForm" onSubmit={handleSendEmail}>
              <input
                type="text"
                placeholder="Your Name"
                value={contact.name}
                onChange={(event) =>
                  handleContactChange("name", event.target.value)
                }
                required
              />

              <input
                type="email"
                placeholder="Your Email"
                value={contact.email}
                onChange={(event) =>
                  handleContactChange("email", event.target.value)
                }
                required
              />

              <textarea
                placeholder="Write your message..."
                rows="5"
                value={contact.message}
                onChange={(event) =>
                  handleContactChange("message", event.target.value)
                }
                required
              />

              <button type="submit">Send Message</button>
            </form>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
