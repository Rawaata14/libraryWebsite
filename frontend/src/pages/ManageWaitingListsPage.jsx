/*
=========================================================
ManageWaitingListsPage.jsx

תיאור הקובץ:
דף ניהול רשימות ההמתנה עבור הספרנית.

אחריות:
- שליפת כל רשימות ההמתנה במערכת.
- הצגת המתנות לספרים ולמקומות.
- הצגת פרטי המשתמשים הממתינים.
- סינון לפי סוג ומצב.
- חיפוש לפי משתמש, ספר או מקום.
- רענון הנתונים מהשרת.

הספרנית אינה משנה ידנית את סדר התור.
הסדר נקבע אוטומטית לפי זמן ההצטרפות בשיטת FIFO.
=========================================================
*/

import { useCallback, useEffect, useMemo, useState } from "react";

import PageBanner from "../components/layout/PageBanner";

import PageShell from "../components/layout/PageShell";

import WaitingListItem from "../components/waiting-lists/WaitingListItem";

import { getAllWaitingLists } from "../services/waitingListService";

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
matchesSearch

תפקיד:
בודקת אם רשומת המתנה מתאימה למונח החיפוש.

החיפוש מתבצע לפי:
- שם המשתמש.
- כתובת המייל.
- שם הספר.
- מחבר.
- מספר המקום.
- מיקום המקום.
---------------------------------------------------------
*/
function matchesSearch(entry, searchTerm) {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  if (!normalizedSearchTerm) {
    return true;
  }

  const searchableValues = [
    entry.fullName,
    entry.userFullName,
    entry.email,
    entry.userEmail,
    entry.title,
    entry.author,
    entry.seatId,
    entry.location,
    entry.seatType,
  ];

  return searchableValues.some((value) =>
    String(value || "")
      .toLowerCase()
      .includes(normalizedSearchTerm),
  );
}

/*
---------------------------------------------------------
matchesStatus

תפקיד:
בודקת אם הרשומה מתאימה למסנן המצב.
---------------------------------------------------------
*/
function matchesStatus(entry, statusFilter) {
  if (statusFilter === "all") {
    return true;
  }

  const normalizedStatus = String(entry.status || "").toLowerCase();

  if (statusFilter === "cancelled") {
    return ["cancelled", "canceled"].includes(normalizedStatus);
  }

  return normalizedStatus === statusFilter;
}

/*
---------------------------------------------------------
ManageWaitingListsPage

תפקיד:
מציגה לספרנית תמונת מצב מלאה של רשימות
ההמתנה במערכת.
---------------------------------------------------------
*/
export default function ManageWaitingListsPage() {
  const [bookWaitingLists, setBookWaitingLists] = useState([]);

  const [seatWaitingLists, setSeatWaitingLists] = useState([]);

  const [selectedType, setSelectedType] = useState("book");

  const [statusFilter, setStatusFilter] = useState("all");

  const [searchTerm, setSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");

  /*
  ---------------------------------------------------------
  loadWaitingLists

  תפקיד:
  טוענת את כל רשימות ההמתנה מהשרת.

  ה-Backend בודק שהמשתמש המחובר הוא ספרנית
  לפני החזרת הנתונים.
  ---------------------------------------------------------
  */
  const loadWaitingLists = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await getAllWaitingLists();

      setBookWaitingLists(Array.isArray(result.books) ? result.books : []);

      setSeatWaitingLists(Array.isArray(result.seats) ? result.seats : []);
    } catch (error) {
      console.error("Failed to load all waiting lists:", error);

      setErrorMessage(getErrorMessage(error, "Failed to load waiting lists."));
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
  selectedEntries

  תפקיד:
  מחזירה את רשימת הספרים או המקומות לפי
  הלשונית שנבחרה.
  ---------------------------------------------------------
  */
  const selectedEntries = useMemo(() => {
    if (selectedType === "seat") {
      return seatWaitingLists;
    }

    return bookWaitingLists;
  }, [bookWaitingLists, seatWaitingLists, selectedType]);

  /*
  ---------------------------------------------------------
  filteredEntries

  תפקיד:
  מסננת את הרשומות לפי מצב ולפי מונח החיפוש.
  ---------------------------------------------------------
  */
  const filteredEntries = useMemo(
    () =>
      selectedEntries.filter(
        (entry) =>
          matchesStatus(entry, statusFilter) &&
          matchesSearch(entry, searchTerm),
      ),
    [selectedEntries, statusFilter, searchTerm],
  );

  /*
  ---------------------------------------------------------
  activeBookCount / activeSeatCount

  תפקיד:
  מחשבות כמה רשומות פעילות קיימות מכל סוג.

  waiting ו-offered נחשבות רשומות פעילות.
  ---------------------------------------------------------
  */
  const activeBookCount = useMemo(
    () =>
      bookWaitingLists.filter((entry) =>
        ["waiting", "offered"].includes(
          String(entry.status || "").toLowerCase(),
        ),
      ).length,
    [bookWaitingLists],
  );

  const activeSeatCount = useMemo(
    () =>
      seatWaitingLists.filter((entry) =>
        ["waiting", "offered"].includes(
          String(entry.status || "").toLowerCase(),
        ),
      ).length,
    [seatWaitingLists],
  );

  /*
  ---------------------------------------------------------
  handleTypeChange

  תפקיד:
  מחליפה בין רשימות הספרים והמקומות ומאפסת
  את מסנן המצב.
  ---------------------------------------------------------
  */
  const handleTypeChange = (type) => {
    setSelectedType(type);
    setStatusFilter("all");
  };

  return (
    <PageShell>
      <PageBanner title="Manage Waiting Lists" />

      <main className="waitingListsPage">
        <section
          className="waitingListsCard"
          aria-labelledby="manage-waiting-lists-title"
        >
          <div className="waitingListsHeader">
            <div>
              <h1 id="manage-waiting-lists-title">Waiting List Management</h1>

              <p>
                Monitor book and seat queues, active offers and completed
                waiting-list entries.
              </p>
            </div>

            <button
              type="button"
              className="waitingListsRefreshButton"
              onClick={loadWaitingLists}
              disabled={isLoading}
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="waitingListsSummary">
            <div>
              <strong>{bookWaitingLists.length}</strong>

              <span>Total Book Entries</span>
            </div>

            <div>
              <strong>{seatWaitingLists.length}</strong>

              <span>Total Seat Entries</span>
            </div>

            <div>
              <strong>{activeBookCount + activeSeatCount}</strong>

              <span>Active Entries</span>
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
              onClick={() => handleTypeChange("book")}
            >
              Book Lists ({bookWaitingLists.length})
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
              onClick={() => handleTypeChange("seat")}
            >
              Seat Lists ({seatWaitingLists.length})
            </button>
          </div>

          <div className="waitingListsToolbar">
            <div>
              <label htmlFor="waiting-list-search">Search</label>

              <input
                id="waiting-list-search"
                type="search"
                value={searchTerm}
                placeholder={
                  selectedType === "book"
                    ? "Search user or book"
                    : "Search user or seat"
                }
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="waiting-list-status">Status</label>

              <select
                id="waiting-list-status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All Statuses</option>

                <option value="waiting">Waiting</option>

                <option value="offered">Offered</option>

                <option value="completed">Completed</option>

                <option value="expired">Expired</option>

                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div
            className="waitingListsResultsInfo"
            role="status"
            aria-live="polite"
          >
            Showing {filteredEntries.length} of {selectedEntries.length} entries
          </div>

          {errorMessage && (
            <div
              className="waitingListsFeedback waitingListsFeedbackError"
              role="alert"
            >
              <p>{errorMessage}</p>

              <button type="button" onClick={loadWaitingLists}>
                Try Again
              </button>
            </div>
          )}

          {isLoading && selectedEntries.length === 0 ? (
            <div className="waitingListsState" role="status">
              Loading waiting lists...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="waitingListsState">
              <span className="waitingListsEmptyIcon" aria-hidden="true">
                ⏳
              </span>

              <h2>No waiting-list entries found</h2>

              <p>Try changing the search or status filter.</p>
            </div>
          ) : (
            <div className="waitingListsItems">
              {filteredEntries.map((entry) => {
                const waitingId =
                  selectedType === "book"
                    ? entry.queueBookId
                    : entry.queueSeatId;

                return (
                  <WaitingListItem
                    key={`${selectedType}-${waitingId}`}
                    entry={entry}
                    type={selectedType}
                    showUser
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
