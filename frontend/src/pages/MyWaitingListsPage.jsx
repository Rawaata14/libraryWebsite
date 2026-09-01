/*
=========================================================
MyWaitingListsPage.jsx

תיאור הקובץ:
דף רשימות ההמתנה של המשתמש המחובר.

אחריות:
- שליפת המתנות לספרים ולמקומות.
- הצגת מספר ההמתנות מכל סוג.
- מעבר בין רשימות ספרים ומקומות.
- הצגת מצבי טעינה ושגיאה.
- ביטול המתנה פעילה.
- רענון הנתונים לאחר פעולה.
=========================================================
*/

import { useCallback, useEffect, useMemo, useState } from "react";

import PageBanner from "../components/layout/PageBanner";

import PageShell from "../components/layout/PageShell";

import WaitingListItem from "../components/waiting-lists/WaitingListItem";

import {
  cancelWaitingEntry,
  getMyWaitingLists,
} from "../services/waitingListService";

/*
---------------------------------------------------------
getErrorMessage

תפקיד:
מחזירה הודעת שגיאה ברורה מתוך שגיאת Axios
או הודעת ברירת מחדל.
---------------------------------------------------------
*/
function getErrorMessage(error, fallbackMessage) {
  return error.response?.data?.message || error.message || fallbackMessage;
}

/*
---------------------------------------------------------
MyWaitingListsPage

תפקיד:
מציגה למשתמש את כל ההמתנות שלו ומאפשרת לו
לעזוב רשימת המתנה פעילה.
---------------------------------------------------------
*/
export default function MyWaitingListsPage() {
  const [bookWaitingLists, setBookWaitingLists] = useState([]);

  const [seatWaitingLists, setSeatWaitingLists] = useState([]);

  const [selectedType, setSelectedType] = useState("book");

  const [isLoading, setIsLoading] = useState(true);

  const [cancellingEntryKey, setCancellingEntryKey] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  const [actionMessage, setActionMessage] = useState({
    type: "",
    text: "",
  });

  /*
  ---------------------------------------------------------
  loadWaitingLists

  תפקיד:
  טוענת מהשרת את רשימות ההמתנה של המשתמש.

  useCallback מאפשר שימוש בטוח בפונקציה גם
  בתוך useEffect וגם בכפתור הרענון.
  ---------------------------------------------------------
  */
  const loadWaitingLists = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await getMyWaitingLists();

      setBookWaitingLists(Array.isArray(result.books) ? result.books : []);

      setSeatWaitingLists(Array.isArray(result.seats) ? result.seats : []);
    } catch (error) {
      console.error("Failed to load waiting lists:", error);

      setErrorMessage(
        getErrorMessage(error, "Failed to load your waiting lists."),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  /*
  ---------------------------------------------------------
  טעינת הנתונים בעת פתיחת הדף
  ---------------------------------------------------------
  */
  useEffect(() => {
    loadWaitingLists();
  }, [loadWaitingLists]);

  /*
  ---------------------------------------------------------
  displayedEntries

  תפקיד:
  מחזירה את הרשימה שצריך להציג לפי הלשונית
  שנבחרה.
  ---------------------------------------------------------
  */
  const displayedEntries = useMemo(() => {
    if (selectedType === "seat") {
      return seatWaitingLists;
    }

    return bookWaitingLists;
  }, [bookWaitingLists, seatWaitingLists, selectedType]);

  /*
  ---------------------------------------------------------
  handleCancel

  תפקיד:
  מבטלת רשומת המתנה של המשתמש.

  לאחר הביטול:
  - הרשימות נטענות מחדש.
  - המיקום של שאר הממתינים מתעדכן.
  - אם בוטלה הצעה פעילה, השרת מעביר אותה
    למשתמש הבא בתור.
  ---------------------------------------------------------
  */
  const handleCancel = async (type, waitingId) => {
    if (!waitingId) {
      return;
    }

    const shouldCancel = window.confirm(
      type === "book"
        ? "Leave this book waiting list?"
        : "Leave this seat waiting list?",
    );

    if (!shouldCancel) {
      return;
    }

    const entryKey = `${type}-${waitingId}`;

    setCancellingEntryKey(entryKey);

    setActionMessage({
      type: "",
      text: "",
    });

    try {
      const result = await cancelWaitingEntry(type, waitingId);

      setActionMessage({
        type: "success",
        text: result.message || "Waiting-list entry cancelled successfully.",
      });

      await loadWaitingLists();
    } catch (error) {
      console.error("Failed to cancel waiting-list entry:", error);

      setActionMessage({
        type: "error",
        text: getErrorMessage(
          error,
          "Failed to cancel the waiting-list entry.",
        ),
      });
    } finally {
      setCancellingEntryKey("");
    }
  };

  /*
  ---------------------------------------------------------
  handleRefresh

  תפקיד:
  טוענת מחדש את רשימות ההמתנה לפי בקשת
  המשתמש.
  ---------------------------------------------------------
  */
  const handleRefresh = async () => {
    setActionMessage({
      type: "",
      text: "",
    });

    await loadWaitingLists();
  };

  return (
    <PageShell>
      <PageBanner title="My Waiting Lists" />

      <main className="waitingListsPage">
        <section
          className="waitingListsCard"
          aria-labelledby="my-waiting-lists-title"
        >
          <div className="waitingListsHeader">
            <div>
              <h1 id="my-waiting-lists-title">My Waiting Lists</h1>

              <p>
                Track your position and offers for unavailable books and seats.
              </p>
            </div>

            <button
              type="button"
              className="waitingListsRefreshButton"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="waitingListsSummary">
            <div>
              <strong>{bookWaitingLists.length}</strong>

              <span>Book Lists</span>
            </div>

            <div>
              <strong>{seatWaitingLists.length}</strong>

              <span>Seat Lists</span>
            </div>
          </div>

          <div
            className="waitingListsTabs"
            role="tablist"
            aria-label="Waiting-list type"
          >
            <button
              type="button"
              role="tab"
              className={
                selectedType === "book"
                  ? "waitingListTab waitingListTabActive"
                  : "waitingListTab"
              }
              aria-selected={selectedType === "book"}
              onClick={() => setSelectedType("book")}
            >
              Books ({bookWaitingLists.length})
            </button>

            <button
              type="button"
              role="tab"
              className={
                selectedType === "seat"
                  ? "waitingListTab waitingListTabActive"
                  : "waitingListTab"
              }
              aria-selected={selectedType === "seat"}
              onClick={() => setSelectedType("seat")}
            >
              Seats ({seatWaitingLists.length})
            </button>
          </div>

          {actionMessage.text && (
            <div
              className={
                actionMessage.type === "success"
                  ? "waitingListsFeedback waitingListsFeedbackSuccess"
                  : "waitingListsFeedback waitingListsFeedbackError"
              }
              role={actionMessage.type === "error" ? "alert" : "status"}
            >
              <p>{actionMessage.text}</p>

              <button
                type="button"
                onClick={() =>
                  setActionMessage({
                    type: "",
                    text: "",
                  })
                }
                aria-label="Close message"
              >
                ×
              </button>
            </div>
          )}

          {errorMessage && (
            <div
              className="waitingListsFeedback waitingListsFeedbackError"
              role="alert"
            >
              <p>{errorMessage}</p>

              <button type="button" onClick={handleRefresh}>
                Try Again
              </button>
            </div>
          )}

          {isLoading && displayedEntries.length === 0 ? (
            <div className="waitingListsState" role="status">
              Loading waiting lists...
            </div>
          ) : displayedEntries.length === 0 ? (
            <div className="waitingListsState">
              <span className="waitingListsEmptyIcon" aria-hidden="true">
                ⏳
              </span>

              <h2>
                {selectedType === "book"
                  ? "No book waiting lists"
                  : "No seat waiting lists"}
              </h2>

              <p>
                {selectedType === "book"
                  ? "Unavailable books you join will appear here."
                  : "Unavailable seats you join will appear here."}
              </p>
            </div>
          ) : (
            <div className="waitingListsItems">
              {displayedEntries.map((entry) => {
                const waitingId =
                  selectedType === "book"
                    ? entry.queueBookId
                    : entry.queueSeatId;

                const entryKey = `${selectedType}-${waitingId}`;

                return (
                  <WaitingListItem
                    key={entryKey}
                    entry={entry}
                    type={selectedType}
                    isCancelling={cancellingEntryKey === entryKey}
                    onCancel={handleCancel}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>
    </PageShell>
  );
}
