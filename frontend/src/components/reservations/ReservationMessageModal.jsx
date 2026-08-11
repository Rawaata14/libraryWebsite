/*
=========================================================
ReservationMessageModal.jsx

תיאור הקובץ:
חלון לשליחת הודעה פנימית למשתמש
מתוך הזמנה קיימת.

הקומפוננטה מציגה:
- פרטי המשתמש.
- פרטי ההזמנה.
- נושא ההודעה.
- תוכן ההודעה.
- כפתורי שליחה וסגירה.

הקומפוננטה אינה מבצעת קריאת API.
פעולת השליחה מתקבלת דרך onSend.
=========================================================
*/

import { formatReservationDate } from "./reservationUtils";

export default function ReservationMessageModal({
  reservation,
  subject,
  message,
  isSending,
  onSubjectChange,
  onMessageChange,
  onClose,
  onSend,
}) {
  /*
    כאשר אין הזמנה נבחרת,
    החלון אינו מוצג.
  */
  if (!reservation) {
    return null;
  }

  return (
    <div
      className="messageModalOverlay"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="messageModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="message-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="messageModalHeader">
          <div>
            <h2 id="message-modal-title">Send Message</h2>

            <p>Reservation #{reservation.reservationId}</p>
          </div>

          <button
            type="button"
            className="closeMessageModalButton"
            onClick={onClose}
            disabled={isSending}
            aria-label="Close message window"
          >
            ×
          </button>
        </div>

        <div className="messageRecipientInfo">
          <p>
            <span>User</span>

            <strong>{reservation.fullName || "Unknown User"}</strong>
          </p>

          <p>
            <span>Email</span>

            <strong>{reservation.email || "-"}</strong>
          </p>

          <p>
            <span>Seat</span>

            <strong>Seat {reservation.seatId}</strong>
          </p>

          <p>
            <span>Date</span>

            <strong>
              {formatReservationDate(reservation.reservationDate)}
            </strong>
          </p>
        </div>

        <label className="messageField" htmlFor="message-subject">
          <span>Subject</span>

          <input
            id="message-subject"
            type="text"
            value={subject}
            onChange={(event) => onSubjectChange(event.target.value)}
            placeholder="Enter message subject..."
            maxLength={100}
            disabled={isSending}
          />

          <small>{subject.length}/100 characters</small>
        </label>

        <label className="messageField" htmlFor="message-content">
          <span>Message</span>

          <textarea
            id="message-content"
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
            placeholder="Write a message to the user..."
            maxLength={500}
            rows={6}
            disabled={isSending}
          />

          <small>{message.length}/500 characters</small>
        </label>

        <p className="messageNotice">
          The message will appear as a new notification in the user&apos;s
          profile.
        </p>

        <div className="messageModalActions">
          <button
            type="button"
            className="cancelMessageButton"
            onClick={onClose}
            disabled={isSending}
          >
            Cancel
          </button>

          <button
            type="button"
            className="confirmMessageButton"
            onClick={onSend}
            disabled={isSending || !subject.trim() || !message.trim()}
          >
            {isSending ? "Sending..." : "Send Message"}
          </button>
        </div>
      </section>
    </div>
  );
}
