const doQuery = require("../query");

/*
---------------------------------------------------------
addMessage

תפקיד:
שמירת הודעה חדשה שנשלחה מטופס Contact במסד הנתונים.
---------------------------------------------------------
*/
async function addMessage(messageData) {
  const { senderName, senderEmail, messageText } = messageData;

  if (!senderName || !senderEmail || !messageText) {
    return {
      success: false,
      message: "Missing required fields",
    };
  }

  const sql =
    "INSERT INTO messages (senderName, senderEmail, messageText) VALUES (?, ?, ?)";

  const result = await doQuery(sql, [senderName, senderEmail, messageText]);

  return {
    success: result.affectedRows > 0,
    message: "Message saved successfully",
  };
}

/*
---------------------------------------------------------
getAllMessages

תפקיד:
שליפת כל ההודעות עבור הספרן.
---------------------------------------------------------
*/
async function getAllMessages() {
  const sql = "SELECT * FROM messages ORDER BY createdAt DESC";

  const messages = await doQuery(sql);

  return {
    success: true,
    messages,
  };
}

/*
---------------------------------------------------------
markMessageAsRead

תפקיד:
סימון הודעה כנקראה לפי מזהה הודעה.
---------------------------------------------------------
*/
async function markMessageAsRead(messageId) {
  const sql = "UPDATE messages SET isRead = TRUE WHERE messageId = ?";

  const result = await doQuery(sql, [messageId]);

  return {
    success: result.affectedRows > 0,
    message: "Message marked as read",
  };
}

module.exports = {
  addMessage,
  getAllMessages,
  markMessageAsRead,
};
