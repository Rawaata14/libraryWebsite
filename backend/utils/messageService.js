const { randomUUID } = require("crypto");
const messageQueries = require("../database/queries/messageQueries");
const notificationQueries = require("../database/queries/notificationQueries");
const { sendLibraryEmail } = require("../utils/mailer");

/*
---------------------------------------------------------
normalizeText

תפקיד:
מנקה ערך טקסט שהתקבל בבקשה.
---------------------------------------------------------
*/
function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/*
---------------------------------------------------------
isValidEmail

תפקיד:
מבצע בדיקה בסיסית של כתובת אימייל.
---------------------------------------------------------
*/
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/*
---------------------------------------------------------
getSessionUserName

תפקיד:
מחזיר את שם המשתמש מתוך ה-Session.
---------------------------------------------------------
*/
function getSessionUserName(user) {
  return user?.fullName || user?.name || "Library User";
}

/*
---------------------------------------------------------
notifyActiveLibrarians

תפקיד:
שולחת התראה לכל הספרניות הפעילות.

כישלון ביצירת ההתראה אינו מבטל הודעה שכבר
נשמרה בהצלחה.
---------------------------------------------------------
*/
async function notifyActiveLibrarians(message, type) {
  const notificationResult =
    await notificationQueries.addNotificationToActiveLibrarians(message, type);

  if (!notificationResult.success) {
    console.error(
      "Message was saved, but librarian notification creation failed.",
    );

    return;
  }

  if (notificationResult.notifiedLibrarians === 0) {
    console.warn("Message was saved, but no active librarians were found.");
  }
}

// פונקציית שירות לפתיחת שיחה חדשה
async function createNewConversation(reqBody, sessionUser) {
  const subject = normalizeText(reqBody.subject);
  const messageText = normalizeText(reqBody.messageText);

  if (!subject || !messageText) {
    return {
      status: 400,
      success: false,
      message: "Subject and message are required",
    };
  }
  if (subject.length > 150) {
    return {
      status: 400,
      success: false,
      message: "Subject must contain no more than 150 characters",
    };
  }
  if (messageText.length > 3000) {
    return {
      status: 400,
      success: false,
      message: "Message must contain no more than 3000 characters",
    };
  }
  if (sessionUser?.role === "librarian") {
    return {
      status: 400,
      success: false,
      message: "Librarians should reply through the messages page",
    };
  }

  let userId = null;
  let senderName;
  let senderEmail;
  let senderRole = "guest";

  if (sessionUser) {
    userId = sessionUser.userId;
    senderName = getSessionUserName(sessionUser);
    senderEmail = normalizeText(sessionUser.email);
    senderRole = "reader";
  } else {
    senderName = normalizeText(reqBody.senderName);
    senderEmail = normalizeText(reqBody.senderEmail);
    if (!senderName || !senderEmail) {
      return {
        status: 400,
        success: false,
        message: "Name and email are required for guests",
      };
    }
    if (!isValidEmail(senderEmail)) {
      return {
        status: 400,
        success: false,
        message: "Please enter a valid email address",
      };
    }
  }

  if (!senderEmail) {
    return {
      status: 400,
      success: false,
      message: "The user account does not contain an email address",
    };
  }

  const conversationId = randomUUID();
  const result = await messageQueries.addMessage({
    conversationId,
    userId,
    senderName,
    senderEmail,
    senderRole,
    recipientRole: "librarian",
    subject,
    messageText,
  });

  if (!result.success) {
    return { status: 400, success: false, message: result.message };
  }

  const notificationType =
    senderRole === "guest" ? "new_guest_message" : "new_reader_message";
  const notificationMessage =
    senderRole === "guest"
      ? `New guest inquiry from ${senderName}: ${subject}`
      : `New message from ${senderName}: ${subject}`;

  await notifyActiveLibrarians(notificationMessage, notificationType);

  return { status: 201, success: true, ...result };
}

// פונקציית שירות להוספת תשובה (כולל שליחת מייל במקרה שהספרנית עונה)
async function addReplyToConversation(conversationId, reqBody, sessionUser) {
  const messageText = normalizeText(reqBody.messageText);

  if (!messageText) {
    return {
      status: 400,
      success: false,
      message: "Reply message is required",
    };
  }
  if (messageText.length > 3000) {
    return {
      status: 400,
      success: false,
      message: "Reply must contain no more than 3000 characters",
    };
  }

  const conversation =
    await messageQueries.getConversationDetails(conversationId);
  if (!conversation) {
    return {
      status: 404,
      success: false,
      message: "Conversation was not found",
    };
  }

  const isLibrarian = sessionUser.role === "librarian";

  if (!isLibrarian) {
    const isOwner = await messageQueries.conversationBelongsToUser(
      conversationId,
      sessionUser.userId,
    );
    if (!isOwner) {
      return {
        status: 403,
        success: false,
        message: "You are not allowed to reply to this conversation",
      };
    }
  }

  if (isLibrarian && !conversation.userId) {
    return {
      status: 400,
      success: false,
      message:
        "Guest replies require an email service, which is not configured",
    };
  }

  const result = await messageQueries.addMessage({
    conversationId,
    userId: conversation.userId,
    senderName: getSessionUserName(sessionUser),
    senderEmail: normalizeText(sessionUser.email),
    senderRole: isLibrarian ? "librarian" : "reader",
    recipientRole: isLibrarian ? "reader" : "librarian",
    subject: conversation.subject,
    messageText,
  });

  if (!result.success) {
    return { status: 400, success: false, message: result.message };
  }

  if (isLibrarian) {
    await notificationQueries.addNotification(
      conversation.userId,
      `New reply from the library: ${conversation.subject}`,
      "librarian_reply",
    );

    // שליחת מייל לסטודנט שהספרנית ענתה לו
    const studentInfo = await messageQueries.getUserEmailForNotification(
      conversation.userId,
    );
    if (studentInfo && studentInfo.email) {
      const emailSubject = `תשובה חדשה מהספרייה בנושא: ${conversation.subject}`;
      const emailHtml = `
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #2c3e50;">תשובה חדשה מהספרנית</h2>
          <p>היי ${studentInfo.firstName || "סטודנט יקר"},</p>
          <p>התקבלה תשובה חדשה לגבי פנייתך:</p>
          <blockquote style="background: #f9f9f9; padding: 12px; border-right: 4px solid #2c3e50; margin: 10px 0;">
            ${messageText}
          </blockquote>
          <br>
          <p>בברכה,<br><b>מערכת הספרייה</b></p>
        </div>
      `;

      await sendLibraryEmail(studentInfo.email, emailSubject, emailHtml);
    }
  } else {
    const senderName = getSessionUserName(sessionUser);
    await notifyActiveLibrarians(
      `New reply from ${senderName}: ${conversation.subject}`,
      "reader_message_reply",
    );
  }

  return { status: 201, success: true, ...result };
}

module.exports = {
  createNewConversation,
  addReplyToConversation,
};
