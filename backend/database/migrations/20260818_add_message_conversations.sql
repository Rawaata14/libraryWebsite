/*
=========================================================
20260818_add_message_conversations.sql

תפקיד:
שדרוג טבלת messages לתמיכה בנושאים,
משתמשים מחוברים ושיחות דו-כיווניות.

יש להריץ את הקובץ פעם אחת בלבד.
=========================================================
*/

ALTER TABLE messages
  ADD COLUMN conversationId CHAR(36) NULL AFTER messageId,
  ADD COLUMN userId INT NULL AFTER conversationId,
  ADD COLUMN senderRole VARCHAR(20) NOT NULL DEFAULT 'guest' AFTER userId,
  ADD COLUMN recipientRole VARCHAR(20) NOT NULL DEFAULT 'librarian'
    AFTER senderRole,
  ADD COLUMN subject VARCHAR(150) NOT NULL AFTER senderEmail;

ALTER TABLE messages
  ADD INDEX idx_messages_conversation (conversationId),
  ADD INDEX idx_messages_user (userId),
  ADD INDEX idx_messages_recipient_read (recipientRole, isRead);