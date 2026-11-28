/*
=========================================================
seatWaitingListService.js

תיאור הקובץ:
שכבת הלוגיקה העסקית של רשימת ההמתנה למקומות.

אחריות:
- אימות תאריך ושעות ההמתנה.
- בדיקת קיום המקום.
- מניעת המתנה למקום חסום.
- בדיקה שהמקום אכן תפוס.
- מניעת המתנה כפולה.
- הצעת המקום לראשון בתור.
- יצירת התראה ומייל.
- בדיקת הרשאה למימוש הצעה.
- ביטול המתנת מקום.

רשימת המתנה למקום נשמרת לפי:
מקום + תאריך + שעת התחלה + שעת סיום.
=========================================================
*/

const seatWaitingListQueries = require("../database/queries/seatWaitingListQueries");
const { doQuery, withTransaction } = require("../database/query");
const notificationQueries = require("../database/queries/notificationQueries");

const { escapeHtml, sendOptionalEmail } = require("../utils/emailService");

const {
  normalizeDate,
  normalizeTime,
  getLibraryDateTime,
  addMinutesToSqlDateTime,
} = require("../utils/formatters");
const {
  getOpeningHours,
  isValidReservationSlot,
} = require("../utils/libraryHours");

/*
משך הזמן שבו הצעת מקום שמורה למשתמש
הראשון בתור.
*/
const SEAT_OFFER_MINUTES = 15;

/*
---------------------------------------------------------
joinSeatWaitingList

תפקיד:
מצרפת משתמש לרשימת המתנה של מקום ומועד.

הפעולה מותרת רק אם:
- התאריך והשעות תקינים.
- המועד עדיין לא התחיל.
- המקום קיים.
- המקום אינו חסום.
- המקום באמת תפוס במועד המבוקש.
- המשתמש אינו כבר ברשימה.

@param {Object} details
פרטי ההמתנה.

@returns {Promise<Object>}
תוצאת ההצטרפות.
---------------------------------------------------------
*/
async function joinSeatWaitingList(details) {
  const { seatId, userId } = details;

  /*
  נרמול ערכי התאריך והשעה שהגיעו
  מה-Frontend.
  */
  const requestedDate = normalizeDate(details.requestedDate);

  const requestedStartTime = normalizeTime(details.requestedStartTime);

  const requestedEndTime = normalizeTime(details.requestedEndTime);

  /*
  בדיקה שהערכים ניתנים לנרמול.
  */
  if (!requestedDate || !requestedStartTime || !requestedEndTime) {
    return {
      success: false,

      statusCode: 400,

      message: "Invalid waiting-list date or time.",
    };
  }

  /*
  שעת ההתחלה חייבת להיות מוקדמת
  משעת הסיום.
  */
  if (requestedStartTime >= requestedEndTime) {
    return {
      success: false,

      statusCode: 400,

      message: "Start time must be earlier " + "than end time.",
    };
  }

  // בדיקה שהספרייה פתוחה בתאריך המבוקש
  const openingHours = getOpeningHours(requestedDate);

  if (!openingHours) {
    return {
      success: false,
      statusCode: 400,
      message: "The library is closed on the selected date.",
    };
  }

  // בדיקה שטווח השעות תואם לחלון הזמנה מותר
  if (
    !isValidReservationSlot(requestedDate, requestedStartTime, requestedEndTime)
  ) {
    return {
      success: false,
      statusCode: 400,
      message:
        `Invalid waiting-list time slot. ` +
        `Library opening hours: ${openingHours.open} - ${openingHours.close}`,
    };
  }
  const libraryNow = getLibraryDateTime();

  const requestedStartKey = `${requestedDate}T${requestedStartTime.slice(0, 5)}`;

  /*
  לא ניתן להצטרף להמתנה למועד
  שכבר התחיל או עבר.
  */
  if (requestedStartKey <= libraryNow.dateTimeKey) {
    return {
      success: false,

      statusCode: 409,

      message: "The selected reservation time " + "has already started.",
    };
  }

  // בדיקת תפוסה, בעלות והצטרפות לרשימת המתנה בטרנזקציה אחת.
  return withTransaction(async (connection) => {
    // נעילת המשתמש לפני הכיסא לשמירה על סדר נעילות אחיד.
    const users = await doQuery(
      "SELECT userId FROM user WHERE userId = ? FOR UPDATE",
      [userId],
      connection,
    );

    if (users.length === 0) {
      return {
        success: false,
        statusCode: 401,
        message: "User not found.",
      };
    }

    const seat = await seatWaitingListQueries.getSeatForUpdate(
      seatId,
      connection,
    );

    if (!seat) {
      return {
        success: false,
        statusCode: 404,
        message: "Seat not found.",
      };
    }

    if (String(seat.status).toLowerCase() === "blocked") {
      return {
        success: false,
        statusCode: 409,
        message: "A blocked seat cannot have a waiting list.",
      };
    }

    // בדיקה שהמקום תפוס במועד המבוקש.
    const isReserved = await seatWaitingListQueries.hasSeatReservation(
      seatId,
      requestedDate,
      requestedStartTime,
      requestedEndTime,
      connection,
    );

    if (!isReserved) {
      return {
        success: false,
        statusCode: 409,
        message: "This seat is available now. You can reserve it directly.",
      };
    }

    // מניעת הצטרפות לרשימת המתנה עבור הזמנה עצמית.
    const isOwnReservation = await seatWaitingListQueries.hasSeatReservation(
      seatId,
      requestedDate,
      requestedStartTime,
      requestedEndTime,
      connection,
      userId,
    );

    if (isOwnReservation) {
      return {
        success: false,
        statusCode: 409,
        message: "You have already reserved this seat for the selected time.",
      };
    }

    // מניעת הצטרפות כפולה לרשימת ההמתנה.
    const existingEntry = await seatWaitingListQueries.getActiveSeatEntry(
      seatId,
      userId,
      requestedDate,
      requestedStartTime,
      requestedEndTime,
      connection,
    );

    if (existingEntry) {
      return {
        success: false,
        statusCode: 409,
        message: "You are already waiting for this seat and time.",
      };
    }

    const waitingId = await seatWaitingListQueries.addSeatEntry(
      seatId,
      userId,
      requestedDate,
      requestedStartTime,
      requestedEndTime,
      connection,
    );

    return {
      success: true,
      statusCode: 201,
      message: `You joined the waiting list for seat ${seatId}.`,
      waitingId,
      waitingDetails: {
        seatId,
        requestedDate,
        requestedStartTime,
        requestedEndTime,
      },
    };
  });
}

async function createSeatOfferInTransaction(
  connection,
  seatId,
  requestedDate,
  requestedStartTime,
  requestedEndTime,
) {
  if (!connection) {
    throw new Error("A transaction connection is required.");
  }

  const normalizedDate = normalizeDate(requestedDate);
  const normalizedStartTime = normalizeTime(requestedStartTime);
  const normalizedEndTime = normalizeTime(requestedEndTime);

  if (
    !normalizedDate ||
    !normalizedStartTime ||
    !normalizedEndTime ||
    !isValidReservationSlot(
      normalizedDate,
      normalizedStartTime,
      normalizedEndTime,
    )
  ) {
    return null;
  }

  const seat = await seatWaitingListQueries.getSeatForUpdate(
    seatId,
    connection,
  );

  if (
    !seat ||
    String(seat.status).toLowerCase() === "blocked" ||
    !["seat", "single-seat", "computer-seat"].includes(seat.type)
  ) {
    return null;
  }

  const libraryNow = getLibraryDateTime();

  if (`${normalizedDate}T${normalizedStartTime}` <= libraryNow.dateTimeKey) {
    return null;
  }

  const isStillReserved = await seatWaitingListQueries.hasSeatReservation(
    seatId,
    normalizedDate,
    normalizedStartTime,
    normalizedEndTime,
    connection,
  );

  if (isStillReserved) {
    return null;
  }

  const hasActiveOffer = await seatWaitingListQueries.hasActiveSeatOffer(
    seatId,
    normalizedDate,
    normalizedStartTime,
    normalizedEndTime,
    libraryNow.sqlDateTime,
    connection,
  );

  if (hasActiveOffer) {
    return null;
  }

  const entry = await seatWaitingListQueries.getFirstWaitingForSeat(
    seatId,
    normalizedDate,
    normalizedStartTime,
    normalizedEndTime,
    connection,
  );

  if (!entry) {
    return null;
  }

  const offeredNow = getLibraryDateTime();

  if (`${normalizedDate}T${normalizedStartTime}` <= offeredNow.dateTimeKey) {
    return null;
  }

  const expiresAt = addMinutesToSqlDateTime(
    offeredNow.sqlDateTime,
    SEAT_OFFER_MINUTES,
  );

  const updateResult = await seatWaitingListQueries.offerSeatEntry(
    entry.queueSeatId,
    offeredNow.sqlDateTime,
    expiresAt,
    seatId,
    connection,
  );

  if (updateResult.affectedRows !== 1) {
    return null;
  }

  return {
    entry,
    seatId,
    normalizedDate,
    normalizedStartTime,
    normalizedEndTime,
    expiresAt,
  };
}

/*
---------------------------------------------------------
offerNextSeat

תפקיד:
מציעה מקום שהתפנה למשתמש הראשון בתור.

הפעולה מתבצעת רק אם:
- המועד עדיין לא התחיל.
- המקום אינו תפוס יותר.
- אין כבר הצעה פעילה.
- קיים משתמש בסטטוס waiting.

לאחר יצירת ההצעה:
- נשמר זמן התפוגה.
- נוצרת התראה באתר.
- נעשה ניסיון לשלוח מייל.

@param {number} seatId
מזהה המקום שהתפנה.

@param {string} requestedDate
התאריך שהתפנה.

@param {string} requestedStartTime
שעת ההתחלה.

@param {string} requestedEndTime
שעת הסיום.

@returns {Promise<Object|null>}
המשתמש שקיבל הצעה או null.
---------------------------------------------------------
*/
async function offerNextSeat(
  seatId,
  requestedDate,
  requestedStartTime,
  requestedEndTime,
) {
  const offer = await withTransaction(async (connection) => {
    return createSeatOfferInTransaction(
      connection,
      seatId,
      requestedDate,
      requestedStartTime,
      requestedEndTime,
    );
  });

  if (!offer) {
    return null;
  }

  return notifySeatOffer(offer);
}

async function notifySeatOffer(offer) {
  if (!offer) {
    return null;
  }

  const {
    entry,
    expiresAt,
    seatId,
    normalizedDate,
    normalizedStartTime,
    normalizedEndTime,
  } = offer;

  const shortStartTime = normalizedStartTime.slice(0, 5);

  const shortEndTime = normalizedEndTime.slice(0, 5);

  const notificationMessage =
    `Seat ${seatId} is available on ` +
    `${normalizedDate}, ` +
    `${shortStartTime}–${shortEndTime}. ` +
    `Reserve it within ` +
    `${SEAT_OFFER_MINUTES} minutes.`;

  /*
  יצירת התראה בתוך האתר.
  */
  const notificationResult = await notificationQueries.addNotification(
    entry.userId,
    notificationMessage,
    "seat_waiting_list_available",
  );

  if (!notificationResult.success) {
    console.error(
      "Seat offer was created, but " + "notification creation failed.",
    );
  }

  /*
  יצירת תוכן הטקסט של המייל.
  */
  const textMessage =
    `Hello ${entry.fullName},\n\n` +
    `Seat ${seatId} is available on ` +
    `${normalizedDate}, ` +
    `${shortStartTime}–${shortEndTime}.\n` +
    `You have ${SEAT_OFFER_MINUTES} ` +
    "minutes to reserve it.\n\n" +
    "Library Team";

  /*
  יצירת תוכן HTML בטוח.
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
        A library seat is available
      </h2>

      <p>
        Hello
        ${escapeHtml(entry.fullName)},
      </p>

      <p>
        Seat
        <strong>
          ${escapeHtml(seatId)}
        </strong>
        is available for you.
      </p>

      <p>
        <strong>Date:</strong>
        ${escapeHtml(normalizedDate)}
        <br>

        <strong>Time:</strong>
        ${escapeHtml(shortStartTime)}
        –
        ${escapeHtml(shortEndTime)}
      </p>

      <p>
        You have
        <strong>
          ${SEAT_OFFER_MINUTES} minutes
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

  אם אין עדיין הגדרת מייל,
  ההתראה באתר נשארת פעילה.
  */
  await sendOptionalEmail(
    entry.email,
    "A library seat is available for you",
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
validateSeatOfferAccess

תפקיד:
בודקת אם המשתמש רשאי להזמין את המקום.

אם אין הצעה פעילה:
ממשיכים לכללי ההזמנה הרגילים.

אם קיימת הצעה:
רק המשתמש שקיבל אותה רשאי להזמין את
אותו מקום ובאותו מועד.

@param {Object} details
פרטי ההזמנה המבוקשת.

@returns {Promise<Object>}
תוצאת בדיקת ההרשאה.
---------------------------------------------------------
*/
async function validateSeatOfferAccess(details) {
  const requestedDate = normalizeDate(details.date);

  const requestedStartTime = normalizeTime(details.startTime);

  const requestedEndTime = normalizeTime(details.endTime);

  /*
  במקרה של נתונים לא תקינים,
  שכבת ההזמנות תחזיר את השגיאה המלאה.

  כאן אין הצעה שניתן להתאים לבקשה.
  */
  if (!requestedDate || !requestedStartTime || !requestedEndTime) {
    return {
      success: true,

      waitingId: null,
    };
  }

  const libraryNow = getLibraryDateTime();

  /*
  בדיקה אם למשתמש קיימת הצעה פעילה
  לאותו מקום ומועד.
  */
  const ownOffer = await seatWaitingListQueries.getSeatOffer(
    details.seatId,
    details.userId,
    requestedDate,
    requestedStartTime,
    requestedEndTime,
    libraryNow.sqlDateTime,
  );

  if (ownOffer) {
    return {
      success: true,

      waitingId: ownOffer.queueSeatId,
    };
  }

  /*
  אם קיימת הצעה למשתמש אחר,
  המקום שמור עבורו עד התפוגה.
  */
  const hasOfferForAnotherUser =
    await seatWaitingListQueries.hasActiveSeatOffer(
      details.seatId,
      requestedDate,
      requestedStartTime,
      requestedEndTime,
      libraryNow.sqlDateTime,
    );

  if (hasOfferForAnotherUser) {
    return {
      success: false,

      statusCode: 409,

      message:
        "This seat is temporarily " +
        "reserved for the next reader " +
        "in line.",
    };
  }

  return {
    success: true,

    waitingId: null,
  };
}

/*
---------------------------------------------------------
cancelSeatWaitingEntry

תפקיד:
מבטלת המתנת מקום של המשתמש.

אם המשתמש ביטל רשומה בסטטוס offered:
המקום מוצע מיד למשתמש הבא בתור.

@param {number} waitingId
מזהה רשומת ההמתנה.

@param {number} userId
מזהה המשתמש.

@returns {Promise<Object>}
תוצאת הביטול.
---------------------------------------------------------
*/
async function cancelSeatWaitingEntry(waitingId, userId) {
  /*
  שליפת הרשומה לפני הביטול,
  כדי לשמור את פרטי המועד ולבדוק
  אם זו הייתה הצעה פעילה.
  */
  const activeEntries =
    await seatWaitingListQueries.getUserSeatWaitingLists(userId);

  const entry = activeEntries.find(
    (currentEntry) => Number(currentEntry.waitingId) === Number(waitingId),
  );

  if (!entry) {
    return {
      success: false,

      statusCode: 404,

      message: "Seat waiting entry not found.",
    };
  }

  const libraryNow = getLibraryDateTime();

  const result = await seatWaitingListQueries.cancelSeatEntry(
    waitingId,
    userId,
    libraryNow.sqlDateTime,
  );

  if (result.affectedRows !== 1) {
    return {
      success: false,

      statusCode: 404,

      message: "Seat waiting entry not found.",
    };
  }

  /*
  אם בוטלה הצעה פעילה,
  מעבירים אותה למשתמש הבא בתור.
  */
  if (entry.status === "offered") {
    await offerNextSeat(
      entry.seatId,
      entry.requestedDate,
      entry.requestedStartTime,
      entry.requestedEndTime,
    );
  }

  return {
    success: true,

    message: "You left the seat waiting list.",
  };
}

async function cancelSeatEntryByLibrarianService(queueSeatId) {
  const normalizedWaitingId = Number(queueSeatId);

  if (!Number.isInteger(normalizedWaitingId) || normalizedWaitingId <= 0) {
    return {
      success: false,
      statusCode: 400,
      message: "Invalid waiting-list ID.",
    };
  }

  const result =
    await seatWaitingListQueries.cancelSeatEntryByLibrarian(
      normalizedWaitingId,
    );

  if (result.affectedRows === 0) {
    return {
      success: false,
      statusCode: 404,
      message: "Waiting entry not found.",
    };
  }

  return {
    success: true,
    message: "Seat waiting entry successfully cancelled by librarian.",
  };
}

module.exports = {
  SEAT_OFFER_MINUTES,
  joinSeatWaitingList,
  offerNextSeat,
  createSeatOfferInTransaction,
  notifySeatOffer,
  validateSeatOfferAccess,
  cancelSeatWaitingEntry,
  cancelSeatEntryByLibrarianService,
};
