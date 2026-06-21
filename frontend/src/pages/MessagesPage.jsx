/*
=========================================================
MessagesPage.jsx

תיאור הקובץ:
דף הודעות לספרן.

הקובץ כולל:
- שליפת הודעות משתמשים מהשרת.
- הצגת הודעות שהגיעו מטופס Contact.
- סימון הודעה כנקראה.
=========================================================
*/

import { useEffect, useState } from "react";
import PageShell from "../components/layout/PageShell";
import PageBanner from "../components/layout/PageBanner";

import "../styles/messages.css";
/*
---------------------------------------------------------
MessagesPage

תפקיד:
מציג לספרן את כל ההודעות שנשלחו על ידי משתמשי האתר.
---------------------------------------------------------
*/
export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  /*
  ---------------------------------------------------------
  fetchMessages

  תפקיד:
  שולף את כל ההודעות מהשרת ומציג אותן בדף.
  ---------------------------------------------------------
  */
  const fetchMessages = async () => {
    try {
      const response = await fetch("http://localhost:8000/messages", {
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Fetch messages error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /*
  ---------------------------------------------------------
  markMessageAsRead

  תפקיד:
  מסמן הודעה כנקראה בשרת ומעדכן את התצוגה בדף.
  ---------------------------------------------------------
  */
  const markMessageAsRead = async (messageId) => {
    try {
      const response = await fetch(
        `http://localhost:8000/messages/${messageId}/read`,
        {
          method: "PUT",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (data.success) {
        setMessages((prevMessages) =>
          prevMessages.map((message) =>
            message.messageId === messageId
              ? { ...message, isRead: true }
              : message,
          ),
        );
      }
    } catch (error) {
      console.error("Mark message as read error:", error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <PageShell>
      <PageBanner title="Messages" />

      <div className="messagesPageContainer">
        <div className="messagesPageCard">
          <h2>Messages From Users</h2>

          {isLoading ? (
            <p className="messagesStateText">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="messagesStateText">No messages yet.</p>
          ) : (
            <div className="messagesList">
              {messages.map((message) => (
                <div
                  key={message.messageId}
                  className={`messageCard ${
                    message.isRead ? "messageRead" : "messageUnread"
                  }`}
                >
                  <div className="messageHeader">
                    <div>
                      <h3>{message.senderName}</h3>
                      <p>{message.senderEmail}</p>
                    </div>

                    <span className="messageStatus">
                      {message.isRead ? "Read" : "New"}
                    </span>
                  </div>

                  <p className="messageText">{message.messageText}</p>

                  <p className="messageDate">
                    {message.createdAt
                      ? new Date(message.createdAt).toLocaleString()
                      : ""}
                  </p>

                  {!message.isRead && (
                    <button
                      type="button"
                      className="markReadButton"
                      onClick={() => markMessageAsRead(message.messageId)}
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
