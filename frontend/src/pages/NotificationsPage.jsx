/*
=========================================================
NotificationsPage.jsx

תיאור הקובץ:
דף ההתראות המשותף למשתמש ולספרנית.

אחריות:
- הצגת כל ההתראות.
- הצגת מספר ההתראות שלא נקראו.
- סינון בין כל ההתראות להתראות חדשות.
- סימון התראה אחת כנקראה.
- סימון כל ההתראות כנקראו.
- רענון ההתראות מהשרת.
- הצגת מצבי טעינה, שגיאה ומצב ריק.
=========================================================
*/

import { useContext, useMemo, useState } from "react";

import NotificationItem from "../components/notifications/NotificationItem";

import PageBanner from "../components/layout/PageBanner";

import PageShell from "../components/layout/PageShell";

import { NotificationContext } from "../context/NotificationContext";

/*
---------------------------------------------------------
NotificationsPage

תפקיד:
מציגה את ההתראות של המשתמש המחובר.

ה-Backend מזהה את המשתמש באמצעות ה-Session,
ולכן אותו דף מתאים גם לקורא וגם לספרנית.
---------------------------------------------------------
*/
export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoadingNotifications,
    notificationError,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useContext(NotificationContext);

  const [selectedFilter, setSelectedFilter] = useState("all");

  const [updatingNotificationId, setUpdatingNotificationId] = useState(null);

  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const [actionMessage, setActionMessage] = useState({
    type: "",
    text: "",
  });

  /*
  ---------------------------------------------------------
  filteredNotifications

  תפקיד:
  מציגה את כל ההתראות או רק את ההתראות
  שלא נקראו, בהתאם למסנן שנבחר.
  ---------------------------------------------------------
  */
  const filteredNotifications = useMemo(() => {
    if (selectedFilter === "unread") {
      return notifications.filter((notification) => !notification.isRead);
    }

    return notifications;
  }, [notifications, selectedFilter]);

  /*
  ---------------------------------------------------------
  handleMarkAsRead

  תפקיד:
  מסמנת התראה אחת כנקראה ומציגה משוב למשתמש.
  ---------------------------------------------------------
  */
  const handleMarkAsRead = async (notificationId) => {
    setUpdatingNotificationId(notificationId);

    setActionMessage({
      type: "",
      text: "",
    });

    try {
      await markAsRead(notificationId);

      setActionMessage({
        type: "success",
        text: "Notification marked as read.",
      });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);

      setActionMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          error.message ||
          "Failed to update the notification.",
      });
    } finally {
      setUpdatingNotificationId(null);
    }
  };

  /*
  ---------------------------------------------------------
  handleMarkAllAsRead

  תפקיד:
  מסמנת את כל ההתראות כנקראו.
  ---------------------------------------------------------
  */
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    setIsMarkingAll(true);

    setActionMessage({
      type: "",
      text: "",
    });

    try {
      await markAllAsRead();

      setActionMessage({
        type: "success",
        text: "All notifications were marked as read.",
      });
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);

      setActionMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          error.message ||
          "Failed to update notifications.",
      });
    } finally {
      setIsMarkingAll(false);
    }
  };

  /*
  ---------------------------------------------------------
  handleRefresh

  תפקיד:
  טוענת מחדש את ההתראות מהשרת.
  ---------------------------------------------------------
  */
  const handleRefresh = async () => {
    setActionMessage({
      type: "",
      text: "",
    });

    await fetchNotifications();
  };

  return (
    <PageShell>
      <PageBanner title="My Notifications" />

      <main className="notificationsPage">
        <section
          className="notificationsCard"
          aria-labelledby={"notifications-page-title"}
        >
          <div className="notificationsHeader">
            <div>
              <h1 id="notifications-page-title">Notifications</h1>

              <p>
                View updates from the library and manage your unread
                notifications.
              </p>
            </div>

            <div className="notificationsHeaderActions">
              <button
                type="button"
                className="notificationsRefreshButton"
                onClick={handleRefresh}
                disabled={isLoadingNotifications}
              >
                {isLoadingNotifications ? "Refreshing..." : "Refresh"}
              </button>

              <button
                type="button"
                className="notificationsReadAllButton"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0 || isMarkingAll}
              >
                {isMarkingAll ? "Updating..." : "Mark All as Read"}
              </button>
            </div>
          </div>

          <div className="notificationsSummary">
            <div>
              <strong>{notifications.length}</strong>

              <span>Total Notifications</span>
            </div>

            <div>
              <strong>{unreadCount}</strong>

              <span>Unread</span>
            </div>
          </div>

          <div
            className="notificationsFilters"
            role="group"
            aria-label={"Filter notifications"}
          >
            <button
              type="button"
              className={
                selectedFilter === "all"
                  ? "notificationFilterButton notificationFilterButtonActive"
                  : "notificationFilterButton"
              }
              onClick={() => setSelectedFilter("all")}
              aria-pressed={selectedFilter === "all"}
            >
              All ({notifications.length})
            </button>

            <button
              type="button"
              className={
                selectedFilter === "unread"
                  ? "notificationFilterButton notificationFilterButtonActive"
                  : "notificationFilterButton"
              }
              onClick={() => setSelectedFilter("unread")}
              aria-pressed={selectedFilter === "unread"}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {actionMessage.text && (
            <div
              className={
                actionMessage.type === "success"
                  ? "notificationsFeedback notificationsFeedbackSuccess"
                  : "notificationsFeedback notificationsFeedbackError"
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
                aria-label={"Close notification message"}
              >
                ×
              </button>
            </div>
          )}

          {notificationError && (
            <div
              className="notificationsFeedback notificationsFeedbackError"
              role="alert"
            >
              <p>{notificationError}</p>

              <button type="button" onClick={handleRefresh}>
                Try Again
              </button>
            </div>
          )}

          {isLoadingNotifications && notifications.length === 0 ? (
            <div className="notificationsState" role="status">
              Loading notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="notificationsState">
              <span className="notificationsEmptyIcon" aria-hidden="true">
                🔔
              </span>

              <h2>
                {selectedFilter === "unread"
                  ? "No unread notifications"
                  : "No notifications yet"}
              </h2>

              <p>
                {selectedFilter === "unread"
                  ? "You have read all of your notifications."
                  : "Library updates will appear here."}
              </p>
            </div>
          ) : (
            <div className="notificationsList">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.notificationId}
                  notification={notification}
                  isUpdating={
                    updatingNotificationId === notification.notificationId
                  }
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </PageShell>
  );
}
