/*
=========================================================
WaitingListItem.jsx

תיאור הקובץ:
קומפוננטה משותפת להצגת רשומה אחת מרשימת
המתנה.

הקומפוננטה מתאימה לשני סוגי המתנה:
- המתנה לספר.
- המתנה למקום ישיבה.

אחריות:
- הצגת פרטי הספר או המקום.
- הצגת מיקום המשתמש בתור.
- הצגת מצב ההמתנה.
- הצגת זמן פקיעת הצעה פעילה.
- מעבר למימוש הצעה פעילה.
- הצגת פרטי המשתמש באזור הספרנית.
- ביטול המתנה פעילה.
=========================================================
*/

import PropTypes from "prop-types";

import { useNavigate } from "react-router-dom";

import Button from "../common/Button";

/*
---------------------------------------------------------
ACTIVE_WAITING_STATUSES

תפקיד:
מגדיר את המצבים שבהם ניתן לבטל את ההמתנה.

waiting:
המשתמש עדיין ממתין בתור.

offered:
הפריט הוצע למשתמש אך עדיין לא הוזמן.
ביטול במצב זה מאפשר להעביר את ההצעה מיד
למשתמש הבא.
---------------------------------------------------------
*/
const ACTIVE_WAITING_STATUSES = ["waiting", "offered"];

/*
---------------------------------------------------------
getStatusLabel

תפקיד:
מחזירה כותרת ידידותית לכל מצב המתנה.
---------------------------------------------------------
*/
function getStatusLabel(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  const statusLabels = {
    waiting: "Waiting",
    offered: "Available for You",
    completed: "Completed",
    expired: "Offer Expired",
    cancelled: "Cancelled",
    canceled: "Cancelled",
  };

  return statusLabels[normalizedStatus] || "Unknown Status";
}

/*
---------------------------------------------------------
getStatusClassName

תפקיד:
מחזירה מחלקת CSS בהתאם למצב ההמתנה.
---------------------------------------------------------
*/
function getStatusClassName(status) {
  const normalizedStatus = String(status || "unknown")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  return `waitingStatus ` + `waitingStatus-${normalizedStatus}`;
}

/*
---------------------------------------------------------
formatDate

תפקיד:
מציגה תאריך בפורמט קריא בלי לבצע המרה ל-UTC.

השימוש בפירוק ידני מונע מעבר ליום הקודם או הבא
בגלל אזור הזמן של הדפדפן.
---------------------------------------------------------
*/
function formatDate(value) {
  if (!value) {
    return "Date unavailable";
  }

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) {
    return String(value);
  }

  return `${match[3]}/` + `${match[2]}/` + `${match[1]}`;
}

/*
---------------------------------------------------------
formatTime

תפקיד:
מציגה שעה בפורמט HH:MM.
---------------------------------------------------------
*/
function formatTime(value) {
  if (!value) {
    return "";
  }

  const match = String(value).match(/^(\d{2}):(\d{2})/);

  if (!match) {
    return String(value);
  }

  return `${match[1]}:${match[2]}`;
}

/*
---------------------------------------------------------
formatDateTime

תפקיד:
מציגה תאריך ושעה של הצעה או פקיעת הצעה.

אם הערך אינו תקין, מוחזר טקסט חלופי במקום
לגרום לקריסת הקומפוננטה.
---------------------------------------------------------
*/
function formatDateTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Time unavailable";
  }

  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/*
---------------------------------------------------------
getWaitingId

תפקיד:
מחזירה את המזהה המתאים לפי סוג רשימת ההמתנה.
---------------------------------------------------------
*/
function getWaitingId(entry, type) {
  if (type === "book") {
    return entry.queueBookId;
  }

  return entry.queueSeatId;
}

/*
---------------------------------------------------------
WaitingListItem

תפקיד:
מציגה כרטיס אחד מרשימת ההמתנה.

showUser:
כאשר הערך true, מוצגים גם פרטי המשתמש.
אפשרות זו מיועדת לדף הניהול של הספרנית.

הספרנית רואה את מצב התור לצורכי ניהול, אך
כפתור מימוש ההצעה מוצג רק למשתמש עצמו.
---------------------------------------------------------
*/
export default function WaitingListItem({
  entry,
  type,
  showUser = false,
  isCancelling = false,
  onCancel,
}) {
  const navigate = useNavigate();

  const normalizedStatus = String(entry.status || "").toLowerCase();

  const waitingId = getWaitingId(entry, type);

  const canCancel =
    ACTIVE_WAITING_STATUSES.includes(normalizedStatus) &&
    typeof onCancel === "function";

  /*
  -------------------------------------------------------
  canOpenOffer

  תפקיד:
  קובעת אם להציג למשתמש כפתור למימוש ההצעה.

  הכפתור מוצג:
  - רק כאשר מצב הרשומה הוא offered.
  - רק בדף המשתמש.
  - אינו מוצג בדף הניהול של הספרנית.
  -------------------------------------------------------
  */
  const canOpenOffer = normalizedStatus === "offered" && !showUser;

  const isBook = type === "book";

  const title = isBook ? entry.title || "Unknown Book" : `Seat ${entry.seatId}`;

  const icon = isBook ? "📚" : "🪑";

  /*
  -------------------------------------------------------
  handleOpenOffer

  תפקיד:
  מעבירה את המשתמש למסך המתאים לצורך מימוש
  ההצעה שקיבל.

  ספר:
  מעבר לדף שריון הספר.

  מקום:
  מעבר למפת הספרייה יחד עם פרטי התאריך והשעה
  של ההצעה.
  -------------------------------------------------------
  */
  const handleOpenOffer = () => {
    if (type === "book") {
      navigate(`/reserve-book/${entry.bookId}`);

      return;
    }

    navigate("/map", {
      state: {
        waitingListOffer: {
          seatId: entry.seatId,

          date: entry.requestedDate,

          startTime: entry.requestedStartTime,

          endTime: entry.requestedEndTime,
        },
      },
    });
  };

  return (
    <article className="waitingListItem">
      <div className="waitingListItemIcon" aria-hidden="true">
        {icon}
      </div>

      <div className="waitingListItemContent">
        <div className="waitingListItemHeading">
          <div>
            <p className="waitingListItemType">
              {isBook ? "Book Waiting List" : "Seat Waiting List"}
            </p>

            <h2>{title}</h2>
          </div>

          <span className={getStatusClassName(normalizedStatus)}>
            {getStatusLabel(normalizedStatus)}
          </span>
        </div>

        {isBook ? (
          <div className="waitingListItemDetails">
            {entry.author && (
              <p>
                <strong>Author:</strong> {entry.author}
              </p>
            )}

            {entry.reservationDate && (
              <p>
                <strong>Library visit:</strong>{" "}
                {formatDate(entry.reservationDate)}
                {entry.startTime &&
                  entry.endTime &&
                  ` · ${formatTime(entry.startTime)}–${formatTime(
                    entry.endTime,
                  )}`}
              </p>
            )}
          </div>
        ) : (
          <div className="waitingListItemDetails">
            {entry.location && (
              <p>
                <strong>Location:</strong> {entry.location}
              </p>
            )}

            {entry.seatType && (
              <p>
                <strong>Type:</strong> {entry.seatType}
              </p>
            )}

            <p>
              <strong>Date:</strong> {formatDate(entry.requestedDate)}
            </p>

            <p>
              <strong>Time:</strong> {formatTime(entry.requestedStartTime)}
              {" – "}
              {formatTime(entry.requestedEndTime)}
            </p>
          </div>
        )}

        {showUser && (
          <div className="waitingListUserDetails">
            <p>
              <strong>User:</strong>{" "}
              {entry.fullName || entry.userFullName || `User ${entry.userId}`}
            </p>

            {(entry.email || entry.userEmail) && (
              <p>
                <strong>Email:</strong> {entry.email || entry.userEmail}
              </p>
            )}
          </div>
        )}

        <div className="waitingListItemMeta">
          {normalizedStatus === "waiting" && (
            <p>
              <strong>Queue position:</strong> {entry.position || "—"}
            </p>
          )}

          {normalizedStatus === "offered" && (
            <p className="waitingOfferMessage">
              This item is available for you. Complete the reservation before
              the offer expires.
            </p>
          )}

          {entry.offerExpiresAt && normalizedStatus === "offered" && (
            <p>
              <strong>Offer expires:</strong>{" "}
              <time dateTime={entry.offerExpiresAt}>
                {formatDateTime(entry.offerExpiresAt)}
              </time>
            </p>
          )}

          {entry.createdAt && (
            <p>
              <strong>Joined:</strong>{" "}
              <time dateTime={entry.createdAt}>
                {formatDateTime(entry.createdAt)}
              </time>
            </p>
          )}
        </div>

        {(canOpenOffer || canCancel) && (
          <div className="waitingListItemActions">
            {/*
            כאשר התקבלה הצעה, המשתמש יכול
            לעבור ישירות למסך המתאים כדי
            לממש אותה.
            */}
            {canOpenOffer && (
              <Button
                variant="success"
                onClick={handleOpenOffer}
                disabled={isCancelling}
                aria-label={
                  type === "book"
                    ? `Reserve offered book ${title}`
                    : `Reserve offered seat ${entry.seatId}`
                }
              >
                {type === "book" ? "Reserve Book Now" : "Open Library Map"}
              </Button>
            )}

            {/*
            המשתמש יכול לעזוב רשימת המתנה
            או לדחות הצעה פעילה.

            דחיית הצעה מאפשרת להעביר אותה
            מיד למשתמש הבא בתור.
            */}
            {canCancel && (
              <Button
                variant="danger"
                onClick={() => onCancel(type, waitingId)}
                disabled={isCancelling}
                aria-label={`Cancel waiting list entry for ${title}`}
              >
                {isCancelling
                  ? "Cancelling..."
                  : normalizedStatus === "offered"
                    ? "Decline Offer"
                    : "Leave Waiting List"}
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

/*
---------------------------------------------------------
WaitingListItem.propTypes

תפקיד:
מגדיר את מבנה רשומת ההמתנה ואת הפעולות
שהקומפוננטה יכולה לקבל.
---------------------------------------------------------
*/
WaitingListItem.propTypes = {
  entry: PropTypes.shape({
    queueBookId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),

    queueSeatId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),

    bookId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),

    seatId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),

    userId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),

    title: PropTypes.string,
    author: PropTypes.string,
    location: PropTypes.string,
    seatType: PropTypes.string,

    fullName: PropTypes.string,
    userFullName: PropTypes.string,
    email: PropTypes.string,
    userEmail: PropTypes.string,

    reservationDate: PropTypes.string,

    startTime: PropTypes.string,

    endTime: PropTypes.string,

    requestedDate: PropTypes.string,

    requestedStartTime: PropTypes.string,

    requestedEndTime: PropTypes.string,

    position: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),

    status: PropTypes.string.isRequired,

    createdAt: PropTypes.string,

    offerExpiresAt: PropTypes.string,
  }).isRequired,

  type: PropTypes.oneOf(["book", "seat"]).isRequired,

  showUser: PropTypes.bool,

  isCancelling: PropTypes.bool,

  onCancel: PropTypes.func,
};
