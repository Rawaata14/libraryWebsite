/*
=========================================================
messageQueries.js

תיאור הקובץ:
שכבת השאילתות של מערכת ההודעות.

הקובץ אחראי על:
- יצירת שיחה חדשה.
- הוספת תשובה לשיחה קיימת.
- שליפת כל השיחות עבור הספרן.
- שליפת השיחות השייכות למשתמש מחובר.
- בדיקת בעלות על שיחה.
- סימון הודעות כנקראו.
=========================================================
*/

const doQuery = require("../query");

/*
---------------------------------------------------------
normalizeMessageValue

תפקיד:
מנקה ערך טקסט לפני שמירתו במסד הנתונים.
---------------------------------------------------------
*/
function normalizeMessageValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

/*
---------------------------------------------------------
addMessage

תפקיד:
שומר הודעה חדשה או תשובה בתוך שיחה קיימת.
---------------------------------------------------------
*/
async function addMessage(messageData) {
  const {
    conversationId,
    userId = null,
    senderName,
    senderEmail,
    senderRole,
    recipientRole,
    subject,
    messageText,
  } = messageData;

  const cleanConversationId = normalizeMessageValue(conversationId);
  const cleanSenderName = normalizeMessageValue(senderName);
  const cleanSenderEmail = normalizeMessageValue(senderEmail);
  const cleanSenderRole = normalizeMessageValue(senderRole);
  const cleanRecipientRole = normalizeMessageValue(recipientRole);
  const cleanSubject = normalizeMessageValue(subject);
  const cleanMessageText = normalizeMessageValue(messageText);

  if (
    !cleanConversationId ||
    !cleanSenderName ||
    !cleanSenderEmail ||
    !cleanSenderRole ||
    !cleanRecipientRole ||
    !cleanSubject ||
    !cleanMessageText
  ) {
    return {
      success: false,
      message: "Missing required message fields",
    };
  }

  const sql = `
    INSERT INTO messages (
      conversationId,
      userId,
      senderRole,
      recipientRole,
      senderName,
      senderEmail,
      subject,
      messageText,
      isRead
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE)
  `;

  const result = await doQuery(sql, [
    cleanConversationId,
    userId,
    cleanSenderRole,
    cleanRecipientRole,
    cleanSenderName,
    cleanSenderEmail,
    cleanSubject,
    cleanMessageText,
  ]);

  return {
    success: result.affectedRows > 0,
    messageId: result.insertId,
    conversationId: cleanConversationId,
    message: "Message saved successfully",
  };
}

/*
---------------------------------------------------------
getAllMessages

תפקיד:
מחזיר לספרן את כל ההודעות מכל השיחות,
מההודעה החדשה ביותר לישנה ביותר.
---------------------------------------------------------
*/
async function getAllMessages() {
  const sql = `
    SELECT
      messageId,
      conversationId,
      userId,
      senderRole,
      recipientRole,
      senderName,
      senderEmail,
      subject,
      messageText,
      isRead,
      createdAt
    FROM messages
    ORDER BY createdAt DESC, messageId DESC
  `;

  const messages = await doQuery(sql);

  return {
    success: true,
    messages,
  };
}

/*
---------------------------------------------------------
getMessagesByUserId

תפקיד:
מחזיר רק את ההודעות בשיחות השייכות למשתמש המחובר.
---------------------------------------------------------
*/
async function getMessagesByUserId(userId) {
  const sql = `
    SELECT
      messageId,
      conversationId,
      userId,
      senderRole,
      recipientRole,
      senderName,
      senderEmail,
      subject,
      messageText,
      isRead,
      createdAt
    FROM messages
    WHERE userId = ?
    ORDER BY createdAt ASC, messageId ASC
  `;

  const messages = await doQuery(sql, [userId]);

  return {
    success: true,
    messages,
  };
}

/*
---------------------------------------------------------
getConversationById

תפקיד:
מחזיר את כל ההודעות השייכות לשיחה מסוימת.
משמש בעיקר את הספרן.
---------------------------------------------------------
*/
async function getConversationById(conversationId) {
  const sql = `
    SELECT
      messageId,
      conversationId,
      userId,
      senderRole,
      recipientRole,
      senderName,
      senderEmail,
      subject,
      messageText,
      isRead,
      createdAt
    FROM messages
    WHERE conversationId = ?
    ORDER BY createdAt ASC, messageId ASC
  `;

  const messages = await doQuery(sql, [conversationId]);

  return {
    success: true,
    messages,
  };
}

/*
---------------------------------------------------------
getConversationDetails

תפקיד:
מחזיר את פרטי ההודעה הראשונה בשיחה.

המידע משמש כאשר מוסיפים תשובה וצריך לדעת:
- למי השיחה שייכת.
- מה נושא השיחה.
- האם השיחה נשלחה על ידי אורח.
---------------------------------------------------------
*/
async function getConversationDetails(conversationId) {
  const sql = `
    SELECT
      conversationId,
      userId,
      senderName,
      senderEmail,
      subject
    FROM messages
    WHERE conversationId = ?
    ORDER BY createdAt ASC, messageId ASC
    LIMIT 1
  `;

  const rows = await doQuery(sql, [conversationId]);

  return rows[0] || null;
}

/*
---------------------------------------------------------
conversationBelongsToUser

תפקיד:
בודק שהשיחה המבוקשת שייכת למשתמש המחובר.

בדיקה זו מונעת ממשתמש לקרוא או להשיב
לשיחה של משתמש אחר.
---------------------------------------------------------
*/
async function conversationBelongsToUser(conversationId, userId) {
  const sql = `
    SELECT COUNT(*) AS count
    FROM messages
    WHERE conversationId = ?
      AND userId = ?
  `;

  const rows = await doQuery(sql, [conversationId, userId]);

  return Number(rows[0]?.count || 0) > 0;
}

/*
---------------------------------------------------------
markConversationAsRead

תפקיד:
מסמן כנקראו רק את ההודעות שנשלחו לנמען הנוכחי.

דוגמה:
כאשר הספרן פותח שיחה, מסומנות כנקראו רק
ההודעות שה-recipientRole שלהן הוא librarian.
---------------------------------------------------------
*/
async function markConversationAsRead(conversationId, recipientRole) {
  const sql = `
    UPDATE messages
    SET isRead = TRUE
    WHERE conversationId = ?
      AND recipientRole = ?
      AND isRead = FALSE
  `;

  const result = await doQuery(sql, [conversationId, recipientRole]);

  return {
    success: true,
    updatedMessages: result.affectedRows,
    message: "Conversation marked as read",
  };
}

/*
---------------------------------------------------------
markMessageAsRead

תפקיד:
מסמן הודעה מסוימת כנקראה.

הפונקציה נשמרת לצורך תאימות עם הקוד הישן,
אבל ה-Route חייב לבדוק הרשאות לפני השימוש בה.
---------------------------------------------------------
*/
async function markMessageAsRead(messageId, recipientRole) {
  const sql = `
    UPDATE messages
    SET isRead = TRUE
    WHERE messageId = ?
      AND recipientRole = ?
  `;

  const result = await doQuery(sql, [messageId, recipientRole]);

  return {
    success: result.affectedRows > 0,
    message: result.affectedRows
      ? "Message marked as read"
      : "Message was not found or cannot be updated",
  };
}

module.exports = {
  addMessage,
  getAllMessages,
  getMessagesByUserId,
  getConversationById,
  getConversationDetails,
  conversationBelongsToUser,
  markConversationAsRead,
  markMessageAsRead,
};
