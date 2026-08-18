/*
=========================================================
ContactForm.jsx

תיאור הקובץ:
טופס יצירת קשר עם הספרייה.

התנהגות:
- משתמש מחובר מזוהה דרך ה-Session.
- שם ואימייל מוצגים רק לאורח.
- כל הודעה כוללת נושא ותוכן.
- מוצגת הודעת הצלחה או שגיאה נגישה.
=========================================================
*/

import { useContext, useState } from "react";
import { Link } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";
import { createMessageConversation } from "../../services/messageService";

/*
---------------------------------------------------------
ContactForm

תפקיד:
מאפשר למשתמש או לאורח לפתוח שיחה חדשה עם הספרייה.
---------------------------------------------------------
*/
export default function ContactForm() {
  const { user } = useContext(AuthContext);

  const [contact, setContact] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState({
    type: "",
    message: "",
  });

  const isAuthenticated = Boolean(user);
  const isLibrarian = user?.role === "librarian";

  /*
  ---------------------------------------------------------
  handleContactChange

  תפקיד:
  מעדכן את שדות הטופס ומנקה הודעה קודמת.
  ---------------------------------------------------------
  */
  const handleContactChange = (field, value) => {
    setContact((previousContact) => ({
      ...previousContact,
      [field]: value,
    }));

    setFeedback({
      type: "",
      message: "",
    });
  };

  /*
  ---------------------------------------------------------
  handleSubmitMessage

  תפקיד:
  שולח הודעה חדשה לשרת.

  עבור משתמש מחובר:
  השרת לוקח את השם, האימייל ומזהה המשתמש מה-Session.

  עבור אורח:
  השם והאימייל נשלחים מהטופס.
  ---------------------------------------------------------
  */
  const handleSubmitMessage = async (event) => {
    event.preventDefault();

    const subject = contact.subject.trim();
    const messageText = contact.message.trim();

    if (!subject || !messageText) {
      setFeedback({
        type: "error",
        message: "Please enter a subject and message.",
      });

      return;
    }

    if (!isAuthenticated) {
      const senderName = contact.name.trim();
      const senderEmail = contact.email.trim();

      if (!senderName || !senderEmail) {
        setFeedback({
          type: "error",
          message: "Please enter your name and email address.",
        });

        return;
      }
    }

    setIsSending(true);
    setFeedback({
      type: "",
      message: "",
    });

    try {
      const requestData = {
        subject,
        messageText,
      };

      /*
      שם ואימייל נשלחים רק עבור אורח.
      משתמש מחובר מזוהה על ידי השרת.
      */
      if (!isAuthenticated) {
        requestData.senderName = contact.name.trim();
        requestData.senderEmail = contact.email.trim();
      }

      await createMessageConversation(requestData);

      setContact((previousContact) => ({
        name: isAuthenticated ? previousContact.name : "",
        email: isAuthenticated ? previousContact.email : "",
        subject: "",
        message: "",
      }));

      setFeedback({
        type: "success",
        message: isAuthenticated
          ? "Your message was sent successfully. You can follow the conversation from My Messages."
          : "Your message was sent successfully.",
      });
    } catch (error) {
      console.error("Send message error:", error);

      setFeedback({
        type: "error",
        message:
          error.message || "An error occurred while sending the message.",
      });
    } finally {
      setIsSending(false);
    }
  };

  /*
  ספרן מנהל הודעות דרך עמוד ההודעות
  ואינו צריך לשלוח פנייה לעצמו.
  */
  if (isLibrarian) {
    return (
      <div className="contactForm contactFormLibrarian">
        <h3>Messages Management</h3>

        <p>
          You are signed in as a librarian. Open the messages page to view and
          respond to users.
        </p>

        <Link className="contactMessagesLink" to="/messages">
          Open Messages
        </Link>
      </div>
    );
  }

  return (
    <form className="contactForm" onSubmit={handleSubmitMessage}>
      {isAuthenticated ? (
        <div className="contactIdentity" aria-label="Current sender">
          <strong>Sending as:</strong>

          <span>
            {user.fullName || user.name || "Library User"}
            {user.email ? ` — ${user.email}` : ""}
          </span>
        </div>
      ) : (
        <>
          <div className="contactField">
            <label htmlFor="contact-name">Your Name</label>

            <input
              id="contact-name"
              type="text"
              value={contact.name}
              onChange={(event) =>
                handleContactChange("name", event.target.value)
              }
              maxLength={100}
              autoComplete="name"
              required
            />
          </div>

          <div className="contactField">
            <label htmlFor="contact-email">Your Email</label>

            <input
              id="contact-email"
              type="email"
              value={contact.email}
              onChange={(event) =>
                handleContactChange("email", event.target.value)
              }
              maxLength={100}
              autoComplete="email"
              required
            />
          </div>
        </>
      )}

      <div className="contactField">
        <label htmlFor="contact-subject">Subject</label>

        <input
          id="contact-subject"
          type="text"
          value={contact.subject}
          onChange={(event) =>
            handleContactChange("subject", event.target.value)
          }
          maxLength={150}
          placeholder="What can we help you with?"
          required
        />

        <span className="contactCharacterCount">
          {contact.subject.length}/150
        </span>
      </div>

      <div className="contactField">
        <label htmlFor="contact-message">Message</label>

        <textarea
          id="contact-message"
          rows="5"
          value={contact.message}
          onChange={(event) =>
            handleContactChange("message", event.target.value)
          }
          maxLength={3000}
          placeholder="Write your message..."
          required
        />

        <span className="contactCharacterCount">
          {contact.message.length}/3000
        </span>
      </div>

      {feedback.message && (
        <div
          className={`contactFeedback ${
            feedback.type === "success"
              ? "contactFeedbackSuccess"
              : "contactFeedbackError"
          }`}
          role={feedback.type === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {feedback.message}
        </div>
      )}

      <button type="submit" disabled={isSending}>
        {isSending ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
