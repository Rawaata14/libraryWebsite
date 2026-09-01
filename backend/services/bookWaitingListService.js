/*
=========================================================
bookWaitingListService.js

תיאור הקובץ:
שכבת הלוגיקה העסקית של רשימת ההמתנה לספרים.

אחריות:
- אימות הצטרפות לרשימת המתנה.
- בדיקת מלאי הספר.
- בדיקת הזמנת המקום שנבחרה.
- מניעת המתנה כפולה.
- הצעת ספר לראשון בתור.
- יצירת התראה בתוך האתר.
- שליחת מייל אופציונלי.
- בדיקת הרשאה למימוש הצעה.
- ביטול המתנת ספר.

למה הקובץ נפרד:
כללי ההמתנה לספר שונים מכללי ההמתנה
למקום, ולכן הם מנוהלים בשירות ייעודי.
=========================================================
*/

const bookWaitingListQueries = require("../database/queries/bookWaitingListQueries");

const notificationQueries = require("../database/queries/notificationQueries");

const {
  getLibraryDateTime,
  addMinutesToSqlDateTime,
} = require("../utils/libraryDateTime");

const { escapeHtml, sendOptionalEmail } = require("./waitingListHelpers");

/*
משך הזמן שבו הצעת ספר שמורה למשתמש
הראשון בתור.
*/
const BOOK_OFFER_MINUTES = 30;

/*
---------------------------------------------------------
joinBookWaitingList

תפקיד:
מצרפת משתמש לרשימת ההמתנה של ספר.

הפעולה מותרת רק אם:
- הספר קיים.
- אין כרגע עותק זמין.
- קיימת הזמנת מקום תקפה.
- ההזמנה שייכת למשתמש.
- למשתמש אין כבר המתנה פעילה לספר.

@param {number} bookId
מזהה הספר.

@param {number} userId
מזהה המשתמש המחובר.

@param {number} seatReservationId
הזמנת המקום שבמסגרתה המשתמש רוצה
להשתמש בספר.

@returns {Promise<Object>}
תוצאת ההצטרפות לרשימה.
---------------------------------------------------------
*/
async function joinBookWaitingList(bookId, userId, seatReservationId) {
  /*
  שליפת הספר ובדיקת קיומו.
  */
  const book = await bookWaitingListQueries.getBook(bookId);

  if (!book) {
    return {
      success: false,

      statusCode: 404,

      message: "Book not found.",
    };
  }

  /*
  אין צורך ברשימת המתנה כאשר קיים
  עותק זמין.
  */
  if (Number(book.available_quantity) > 0) {
    return {
      success: false,

      statusCode: 409,

      message: "This book is available now. " + "You can reserve it directly.",
    };
  }

  /*
  קבלת התאריך והשעה לפי שעון ישראל
  לצורך בדיקת הזמנת המקום.
  */
  const libraryNow = getLibraryDateTime();

  /*
  בדיקה שהזמנת המקום:
  - קיימת.
  - שייכת למשתמש.
  - עדיין תקפה.
  */
  const reservation = await bookWaitingListQueries.getEligibleSeatReservation(
    seatReservationId,
    userId,
    libraryNow.date,
    libraryNow.time,
  );

  if (!reservation) {
    return {
      success: false,

      statusCode: 409,

      message: "Select a valid upcoming seat " + "reservation before joining.",
    };
  }

  /*
  מניעת המתנה כפולה לאותו ספר.
  */
  const existingEntry = await bookWaitingListQueries.getActiveBookEntry(
    bookId,
    userId,
  );

  if (existingEntry) {
    return {
      success: false,

      statusCode: 409,

      message: "You are already on the " + "waiting list for this book.",
    };
  }

  /*
  יצירת רשומת ההמתנה.
  */
  const waitingId = await bookWaitingListQueries.addBookEntry(
    bookId,
    userId,
    seatReservationId,
  );

  return {
    success: true,

    statusCode: 201,

    message: `You joined the waiting list ` + `for “${book.title}”.`,

    waitingId,

    reservation: {
      reservationId: reservation.reservationId,

      seatId: reservation.seatId,

      reservationDate: reservation.reservationDate,

      startTime: reservation.startTime,

      endTime: reservation.endTime,
    },
  };
}

/*
---------------------------------------------------------
offerNextBook

תפקיד:
מציעה עותק זמין למשתמש הראשון בתור.

הפעולה מתבצעת רק אם:
- אין כבר הצעה פעילה לספר.
- קיים לפחות עותק אחד זמין.
- קיים משתמש בסטטוס waiting.

לאחר יצירת ההצעה:
- נשמר זמן התפוגה.
- נוצרת התראה בתוך האתר.
- נעשה ניסיון לשלוח מייל.

@param {number} bookId
מזהה הספר שהתפנה.

@returns {Promise<Object|null>}
המשתמש שקיבל את ההצעה או null.
---------------------------------------------------------
*/
async function offerNextBook(bookId) {
  const libraryNow = getLibraryDateTime();

  /*
  אם קיימת כבר הצעה פעילה,
  אין לשלוח הצעה נוספת.
  */
  const hasActiveOffer = await bookWaitingListQueries.hasActiveBookOffer(
    bookId,
    libraryNow.sqlDateTime,
  );

  if (hasActiveOffer) {
    return null;
  }

  /*
  בדיקה שהספר עדיין קיים ושיש מלאי זמין.
  */
  const book = await bookWaitingListQueries.getBook(bookId);

  if (!book || Number(book.available_quantity) <= 0) {
    return null;
  }

  /*
  בחירת המשתמש הראשון בתור.
  */
  const entry = await bookWaitingListQueries.getFirstWaitingForBook(bookId);

  if (!entry) {
    return null;
  }

  /*
  חישוב מועד תפוגת ההצעה.

  הצעת ספר תקפה ל-30 דקות.
  */
  const expiresAt = addMinutesToSqlDateTime(
    libraryNow.sqlDateTime,
    BOOK_OFFER_MINUTES,
  );

  /*
  העברת הרשומה מ-waiting ל-offered.
  */
  const updateResult = await bookWaitingListQueries.offerBookEntry(
    entry.queueBookId,
    libraryNow.sqlDateTime,
    expiresAt,
  );

  /*
  אם הרשומה כבר השתנתה על ידי פעולה אחרת,
  לא שולחים התראה כפולה.
  */
  if (updateResult.affectedRows !== 1) {
    return null;
  }

  const notificationMessage =
    `The book “${entry.title}” is ` +
    "available for you. " +
    `Reserve it within ` +
    `${BOOK_OFFER_MINUTES} minutes.`;

  /*
  יצירת התראה בתוך האתר.

  ההתראה היא הפעולה העיקרית ואינה תלויה
  בשירות המייל.
  */
  const notificationResult = await notificationQueries.addNotification(
    entry.userId,
    notificationMessage,
    "book_waiting_list_available",
  );

  if (!notificationResult.success) {
    console.error(
      "Book offer was created, but " + "notification creation failed.",
    );
  }

  /*
  יצירת גרסת טקסט למייל.
  */
  const textMessage =
    `Hello ${entry.fullName},\n\n` +
    `The book “${entry.title}” is ` +
    "available for you.\n" +
    `You have ${BOOK_OFFER_MINUTES} ` +
    "minutes to reserve it.\n\n" +
    "Library Team";

  /*
  יצירת HTML בטוח.

  הערכים ממסד הנתונים עוברים escapeHtml
  לפני שילובם בתוכן המייל.
  */
  const htmlMessage = `
    <div
      style="
        font-family: Arial, sans-serif;
        line-height: 1.7;
        color: #3f2925;
      "
    >
      <h2 style="color: #743b32;">
        A book is available for you
      </h2>

      <p>
        Hello
        ${escapeHtml(entry.fullName)},
      </p>

      <p>
        The book
        <strong>
          ${escapeHtml(entry.title)}
        </strong>
        is now available for you.
      </p>

      <p>
        You have
        <strong>
          ${BOOK_OFFER_MINUTES} minutes
        </strong>
        to reserve it.
      </p>

      <p>
        Library Team
      </p>
    </div>
  `;

  /*
  ניסיון שליחת מייל.

  כשל במייל אינו מבטל את ההצעה
  או את ההתראה בתוך האתר.
  */
  await sendOptionalEmail(
    entry.email,
    "A library book is available for you",
    htmlMessage,
    textMessage,
  );

  return {
    ...entry,

    offerExpiresAt: expiresAt,
  };
}

/*
---------------------------------------------------------
validateBookOfferAccess

תפקיד:
בודקת אם המשתמש רשאי להזמין את הספר.

אם אין הצעה פעילה לספר:
כללי ההזמנה הרגילים ממשיכים לפעול.

אם קיימת הצעה פעילה:
- רק המשתמש שקיבל אותה רשאי להזמין.
- עליו לבחור את הזמנת המקום שאליה
  ההמתנה קושרה.

@param {number} bookId
מזהה הספר.

@param {number} userId
מזהה המשתמש.

@param {number} seatReservationId
הזמנת המקום שנבחרה למימוש הספר.

@returns {Promise<Object>}
תוצאת בדיקת ההרשאה.
---------------------------------------------------------
*/
async function validateBookOfferAccess(bookId, userId, seatReservationId) {
  const libraryNow = getLibraryDateTime();

  /*
  בדיקה אם למשתמש קיימת הצעה פעילה.
  */
  const ownOffer = await bookWaitingListQueries.getBookOffer(
    bookId,
    userId,
    libraryNow.sqlDateTime,
  );

  if (ownOffer) {
    /*
    ההצעה חייבת להתממש באמצעות הזמנת
    המקום שנבחרה בעת ההצטרפות.
    */
    if (Number(ownOffer.seatReservationId) !== Number(seatReservationId)) {
      return {
        success: false,

        statusCode: 409,

        message:
          "Select the seat reservation " + "linked to this waiting-list offer.",
      };
    }

    return {
      success: true,

      waitingId: ownOffer.queueBookId,
    };
  }

  /*
  אם ההצעה שייכת למשתמש אחר,
  העותק שמור עבורו עד זמן התפוגה.
  */
  const hasOfferForAnotherUser =
    await bookWaitingListQueries.hasActiveBookOffer(
      bookId,
      libraryNow.sqlDateTime,
    );

  if (hasOfferForAnotherUser) {
    return {
      success: false,

      statusCode: 409,

      message:
        "This copy is temporarily " +
        "reserved for the next reader " +
        "in line.",
    };
  }

  /*
  אין הצעה פעילה ולכן אפשר להמשיך
  לבדיקות ההזמנה הרגילות.
  */
  return {
    success: true,

    waitingId: null,
  };
}

/*
---------------------------------------------------------
cancelBookWaitingEntry

תפקיד:
מבטלת המתנת ספר של המשתמש.

אם המשתמש ביטל רשומה בסטטוס offered:
הספר מוצע למשתמש הבא בתור.

@param {number} waitingId
מזהה רשומת ההמתנה.

@param {number} userId
מזהה המשתמש המחובר.

@returns {Promise<Object>}
תוצאת הביטול.
---------------------------------------------------------
*/
async function cancelBookWaitingEntry(waitingId, userId) {
  /*
  שליפת הרשומות הפעילות לפני הביטול,
  כדי לדעת אם זו הייתה הצעה פעילה.
  */
  const activeEntries =
    await bookWaitingListQueries.getUserBookWaitingLists(userId);

  const entry = activeEntries.find(
    (currentEntry) => Number(currentEntry.waitingId) === Number(waitingId),
  );

  if (!entry) {
    return {
      success: false,

      statusCode: 404,

      message: "Book waiting entry not found.",
    };
  }

  const libraryNow = getLibraryDateTime();

  const result = await bookWaitingListQueries.cancelBookEntry(
    waitingId,
    userId,
    libraryNow.sqlDateTime,
  );

  if (result.affectedRows !== 1) {
    return {
      success: false,

      statusCode: 404,

      message: "Book waiting entry not found.",
    };
  }

  /*
  אם בוטלה הצעה פעילה,
  מקדמים מיד את המשתמש הבא.
  */
  if (entry.status === "offered") {
    await offerNextBook(entry.bookId);
  }

  return {
    success: true,

    message: "You left the book waiting list.",
  };
}

module.exports = {
  BOOK_OFFER_MINUTES,
  joinBookWaitingList,
  offerNextBook,
  validateBookOfferAccess,
  cancelBookWaitingEntry,
};
