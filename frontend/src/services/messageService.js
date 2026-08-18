/*
=========================================================
messageService.js

תיאור הקובץ:
מרכז את כל בקשות ה-API של מערכת ההודעות.

הקובץ כולל:
- פתיחת שיחה חדשה.
- שליפת הודעות המשתמש.
- שליפת כל ההודעות עבור הספרן.
- שליפת שיחה מסוימת.
- שליחת תשובה.
- סימון שיחה כנקראה.
=========================================================
*/

import { buildApiUrl } from "../config/api";

/*
---------------------------------------------------------
handleResponse

תפקיד:
קורא את תשובת השרת ומטפל בשגיאות באופן אחיד.
---------------------------------------------------------
*/
async function handleResponse(response) {
  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an invalid response");
  }

  if (!response.ok) {
    throw new Error(data.message || "Message request failed");
  }

  return data;
}

/*
---------------------------------------------------------
createMessageConversation

תפקיד:
פותח שיחת הודעות חדשה דרך טופס Contact.
---------------------------------------------------------
*/
export async function createMessageConversation(messageData) {
  const response = await fetch(buildApiUrl("/messages"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(messageData),
  });

  return handleResponse(response);
}

/*
---------------------------------------------------------
getMyMessages

תפקיד:
מחזיר למשתמש המחובר את כל השיחות השייכות לו.
---------------------------------------------------------
*/
export async function getMyMessages() {
  const response = await fetch(buildApiUrl("/messages/mine"), {
    credentials: "include",
  });

  return handleResponse(response);
}

/*
---------------------------------------------------------
getAllMessages

תפקיד:
מחזיר את כל ההודעות לספרן בלבד.
---------------------------------------------------------
*/
export async function getAllMessages() {
  const response = await fetch(buildApiUrl("/messages"), {
    credentials: "include",
  });

  return handleResponse(response);
}

/*
---------------------------------------------------------
getConversation

תפקיד:
מחזיר את כל ההודעות בשיחה מסוימת.
ה-Backend בודק שלמשתמש יש הרשאה לצפות בשיחה.
---------------------------------------------------------
*/
export async function getConversation(conversationId) {
  const response = await fetch(buildApiUrl(`/messages/${conversationId}`), {
    credentials: "include",
  });

  return handleResponse(response);
}

/*
---------------------------------------------------------
replyToConversation

תפקיד:
שולח תשובה לשיחה קיימת.
---------------------------------------------------------
*/
export async function replyToConversation(conversationId, messageText) {
  const response = await fetch(
    buildApiUrl(`/messages/${conversationId}/reply`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        messageText,
      }),
    },
  );

  return handleResponse(response);
}

/*
---------------------------------------------------------
markConversationAsRead

תפקיד:
מסמן את ההודעות שנשלחו למשתמש הנוכחי כנקראו.
---------------------------------------------------------
*/
export async function markConversationAsRead(conversationId) {
  const response = await fetch(
    buildApiUrl(`/messages/${conversationId}/read`),
    {
      method: "PUT",
      credentials: "include",
    },
  );

  return handleResponse(response);
}
