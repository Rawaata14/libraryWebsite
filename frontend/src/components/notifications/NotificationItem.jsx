/*
=========================================================
NotificationItem.jsx

תיאור הקובץ:
מציגה התראה אחת בדף ההתראות.

אחריות:
- הצגת סוג ההתראה.
- הצגת תוכן ההתראה.
- הצגת תאריך ושעת השליחה.
- הבחנה בין התראה שנקראה להתראה חדשה.
- סימון התראה אחת כנקראה.
=========================================================
*/

import PropTypes from "prop-types";

/*
---------------------------------------------------------
getNotificationIcon

תפקיד:
מחזירה אייקון בהתאם לסוג ההתראה.
---------------------------------------------------------
*/
function getNotificationIcon(type) {
  const normalizedType = type?.toLowerCase() || "";

  if (normalizedType.includes("book")) {
    return "📚";
  }

  if (
    normalizedType.includes("seat") ||
    normalizedType.includes("reservation")
  ) {
    return "🪑";
  }

  if (normalizedType.includes("message")) {
    return "✉️";
  }

  if (normalizedType.includes("cancel")) {
    return "🚫";
  }

  if (normalizedType.includes("waiting")) {
    return "⏳";
  }

  return "🔔";
}

/*
---------------------------------------------------------
getNotificationTypeLabel

תפקיד:
מחזירה כותרת ידידותית בהתאם לסוג ההתראה.
---------------------------------------------------------
*/
function getNotificationTypeLabel(type) {
  if (!type) {
    return "Library Notification";
  }

  return type
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/*
---------------------------------------------------------
formatNotificationDate

תפקיד:
ממירה את תאריך ההתראה לפורמט קריא.

אם התאריך אינו תקין מוחזר טקסט חלופי,
כדי למנוע קריסה של הקומפוננטה.
---------------------------------------------------------
*/
function formatNotificationDate(dateValue) {
  if (!dateValue) {
    return "Date unavailable";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/*
---------------------------------------------------------
NotificationItem

תפקיד:
מציגה כרטיס של התראה אחת.
---------------------------------------------------------
*/
export default function NotificationItem({
  notification,
  isUpdating = false,
  onMarkAsRead,
}) {
  const notificationId = notification.notificationId;

  const isUnread = !notification.isRead;

  return (
    <article
      className={
        isUnread
          ? "notificationItem notificationItemUnread"
          : "notificationItem"
      }
    >
      <div className="notificationItemIcon" aria-hidden="true">
        {getNotificationIcon(notification.type)}
      </div>

      <div className="notificationItemContent">
        <div className="notificationItemHeading">
          <div>
            <h2>{getNotificationTypeLabel(notification.type)}</h2>

            {isUnread && <span className="notificationNewBadge">New</span>}
          </div>

          <time dateTime={notification.sentDate || ""}>
            {formatNotificationDate(notification.sentDate)}
          </time>
        </div>

        <p>{notification.message}</p>

        {isUnread && (
          <button
            type="button"
            className="notificationReadButton"
            onClick={() => onMarkAsRead(notificationId)}
            disabled={isUpdating}
            aria-label={"Mark this notification as read"}
          >
            {isUpdating ? "Updating..." : "Mark as Read"}
          </button>
        )}
      </div>
    </article>
  );
}

/*
---------------------------------------------------------
NotificationItem.propTypes
---------------------------------------------------------
*/
NotificationItem.propTypes = {
  notification: PropTypes.shape({
    notificationId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
      .isRequired,

    message: PropTypes.string.isRequired,

    sentDate: PropTypes.string,

    type: PropTypes.string,

    isRead: PropTypes.bool.isRequired,
  }).isRequired,

  isUpdating: PropTypes.bool,

  onMarkAsRead: PropTypes.func.isRequired,
};
