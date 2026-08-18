/*
=========================================================
MyMessagesPage.jsx

תיאור הקובץ:
עמוד השיחות של המשתמש המחובר.

העמוד כולל:
- הצגת כל שיחות המשתמש.
- הצגת מספר הודעות שלא נקראו.
- בחירת שיחה.
- הצגת ההודעות לפי סדר השליחה.
- שליחת תשובה לספרן.
- סימון הודעות הספרן כנקראו.
=========================================================
*/

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import PageShell from "../components/layout/PageShell";
import PageBanner from "../components/layout/PageBanner";

import {
  getMyMessages,
  markConversationAsRead,
  replyToConversation,
} from "../services/messageService";

import "../styles/my-messages.css";

/*
---------------------------------------------------------
formatMessageDate

תפקיד:
מציג את תאריך ההודעה בצורה קריאה.
---------------------------------------------------------
*/
function formatMessageDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/*
---------------------------------------------------------
groupMessagesByConversation

תפקיד:
מקבץ את ההודעות לפי conversationId ויוצר
רשימת שיחות מסודרת לפי ההודעה האחרונה.
---------------------------------------------------------
*/
function groupMessagesByConversation(messages) {
  const conversationMap = new Map();

  messages.forEach((message) => {
    const conversationId = message.conversationId;

    if (!conversationMap.has(conversationId)) {
      conversationMap.set(conversationId, {
        conversationId,
        subject: message.subject,
        messages: [],
        unreadCount: 0,
        latestDate: message.createdAt,
      });
    }

    const conversation = conversationMap.get(conversationId);

    conversation.messages.push(message);
    conversation.latestDate = message.createdAt;

    if (message.recipientRole === "reader" && !message.isRead) {
      conversation.unreadCount += 1;
    }
  });

  return Array.from(conversationMap.values())
    .map((conversation) => ({
      ...conversation,
      messages: [...conversation.messages].sort(
        (firstMessage, secondMessage) =>
          new Date(firstMessage.createdAt) - new Date(secondMessage.createdAt),
      ),
    }))
    .sort(
      (firstConversation, secondConversation) =>
        new Date(secondConversation.latestDate) -
        new Date(firstConversation.latestDate),
    );
}

/*
---------------------------------------------------------
MyMessagesPage

תפקיד:
מציג ומנהל את שיחות המשתמש עם הספרייה.
---------------------------------------------------------
*/
export default function MyMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [replyText, setReplyText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [feedback, setFeedback] = useState({
    type: "",
    message: "",
  });

  /*
  ---------------------------------------------------------
  fetchMessages

  תפקיד:
  טוען מחדש את כל שיחות המשתמש.
  ---------------------------------------------------------
  */
  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);

      const data = await getMyMessages();
      const loadedMessages = data.messages || [];

      setMessages(loadedMessages);

      if (loadedMessages.length > 0) {
        setSelectedConversationId((currentConversationId) => {
          const currentConversationStillExists = loadedMessages.some(
            (message) => message.conversationId === currentConversationId,
          );

          if (currentConversationStillExists) {
            return currentConversationId;
          }

          return loadedMessages[0].conversationId;
        });
      } else {
        setSelectedConversationId("");
      }
    } catch (error) {
      console.error("Failed to load user messages:", error);

      setFeedback({
        type: "error",
        message:
          error.message || "An error occurred while loading your messages.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const conversations = useMemo(
    () => groupMessagesByConversation(messages),
    [messages],
  );

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) =>
          conversation.conversationId === selectedConversationId,
      ) || null,
    [conversations, selectedConversationId],
  );

  /*
  ---------------------------------------------------------
  סימון שיחה כנקראה

  בכל פעם שהמשתמש פותח שיחה, הודעות הספרן
  באותה שיחה מסומנות כנקראו.
  ---------------------------------------------------------
  */
  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    const markSelectedConversationAsRead = async () => {
      try {
        await markConversationAsRead(selectedConversationId);

        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.conversationId === selectedConversationId &&
            message.recipientRole === "reader"
              ? {
                  ...message,
                  isRead: true,
                }
              : message,
          ),
        );
      } catch (error) {
        console.error("Failed to mark conversation as read:", error);
      }
    };

    markSelectedConversationAsRead();
  }, [selectedConversationId]);

  /*
  ---------------------------------------------------------
  handleConversationSelect

  תפקיד:
  פותח את השיחה שנבחרה ומנקה הודעות קודמות.
  ---------------------------------------------------------
  */
  const handleConversationSelect = (conversationId) => {
    setSelectedConversationId(conversationId);
    setReplyText("");
    setFeedback({
      type: "",
      message: "",
    });
  };

  /*
  ---------------------------------------------------------
  handleReplySubmit

  תפקיד:
  שולח תשובה חדשה לספרן בתוך השיחה הפעילה.
  ---------------------------------------------------------
  */
  const handleReplySubmit = async (event) => {
    event.preventDefault();

    const cleanReply = replyText.trim();

    if (!selectedConversationId || !cleanReply) {
      setFeedback({
        type: "error",
        message: "Please write a reply before sending.",
      });

      return;
    }

    setIsReplying(true);
    setFeedback({
      type: "",
      message: "",
    });

    try {
      await replyToConversation(selectedConversationId, cleanReply);

      setReplyText("");

      setFeedback({
        type: "success",
        message: "Your reply was sent successfully.",
      });

      await fetchMessages();
    } catch (error) {
      console.error("Failed to send reply:", error);

      setFeedback({
        type: "error",
        message: error.message || "An error occurred while sending your reply.",
      });
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <PageShell>
      <PageBanner title="My Messages" />

      <main className="myMessagesPageContainer">
        {isLoading ? (
          <div className="myMessagesState" role="status" aria-live="polite">
            Loading your conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="myMessagesState">
            <span className="myMessagesEmptyIcon" aria-hidden="true">
              ✉️
            </span>

            <h2>No conversations yet</h2>

            <p>
              Contact the library if you have a question or need assistance.
            </p>

            <Link className="myMessagesContactLink" to="/about">
              Contact the Library
            </Link>
          </div>
        ) : (
          <div className="myMessagesLayout">
            <aside
              className="myMessagesSidebar"
              aria-label="Your conversations"
            >
              <div className="myMessagesSidebarHeader">
                <h2>Conversations</h2>

                <span>{conversations.length}</span>
              </div>

              <div className="myMessagesConversationList">
                {conversations.map((conversation) => {
                  const lastMessage =
                    conversation.messages[conversation.messages.length - 1];

                  const isSelected =
                    conversation.conversationId === selectedConversationId;

                  return (
                    <button
                      key={conversation.conversationId}
                      type="button"
                      className={`myMessagesConversationButton ${
                        isSelected ? "myMessagesConversationSelected" : ""
                      }`}
                      onClick={() =>
                        handleConversationSelect(conversation.conversationId)
                      }
                      aria-pressed={isSelected}
                    >
                      <span className="myMessagesConversationTop">
                        <strong>{conversation.subject}</strong>

                        {conversation.unreadCount > 0 && (
                          <span
                            className="myMessagesUnreadBadge"
                            aria-label={`${conversation.unreadCount} unread messages`}
                          >
                            {conversation.unreadCount}
                          </span>
                        )}
                      </span>

                      <span className="myMessagesConversationPreview">
                        {lastMessage?.senderRole === "librarian"
                          ? "Library: "
                          : "You: "}
                        {lastMessage?.messageText}
                      </span>

                      <span className="myMessagesConversationDate">
                        {formatMessageDate(conversation.latestDate)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section
              className="myMessagesThread"
              aria-label="Selected conversation"
            >
              {selectedConversation && (
                <>
                  <header className="myMessagesThreadHeader">
                    <div>
                      <span>Subject</span>
                      <h2>{selectedConversation.subject}</h2>
                    </div>
                  </header>

                  <div className="myMessagesThreadBody" aria-live="polite">
                    {selectedConversation.messages.map((message) => {
                      const isLibraryMessage =
                        message.senderRole === "librarian";

                      return (
                        <article
                          key={message.messageId}
                          className={`myMessagesBubble ${
                            isLibraryMessage
                              ? "myMessagesBubbleLibrary"
                              : "myMessagesBubbleUser"
                          }`}
                        >
                          <strong>
                            {isLibraryMessage ? "Library" : "You"}
                          </strong>

                          <p>{message.messageText}</p>

                          <time dateTime={message.createdAt || ""}>
                            {formatMessageDate(message.createdAt)}
                          </time>
                        </article>
                      );
                    })}
                  </div>

                  <form
                    className="myMessagesReplyForm"
                    onSubmit={handleReplySubmit}
                  >
                    <label htmlFor="my-message-reply">
                      Reply to the Library
                    </label>

                    <textarea
                      id="my-message-reply"
                      rows="4"
                      value={replyText}
                      onChange={(event) => {
                        setReplyText(event.target.value);

                        setFeedback({
                          type: "",
                          message: "",
                        });
                      }}
                      maxLength={3000}
                      placeholder="Write your reply..."
                      required
                    />

                    <div className="myMessagesReplyFooter">
                      <span>{replyText.length}/3000</span>

                      <button
                        type="submit"
                        disabled={isReplying || !replyText.trim()}
                      >
                        {isReplying ? "Sending..." : "Send Reply"}
                      </button>
                    </div>
                  </form>

                  {feedback.message && (
                    <div
                      className={`myMessagesFeedback ${
                        feedback.type === "success"
                          ? "myMessagesFeedbackSuccess"
                          : "myMessagesFeedbackError"
                      }`}
                      role={feedback.type === "error" ? "alert" : "status"}
                    >
                      {feedback.message}
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        )}
      </main>
    </PageShell>
  );
}
