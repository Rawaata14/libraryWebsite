/*
=========================================================
NotificationContext.jsx

תיאור הקובץ:
Context גלובלי לניהול התראות המשתמש המחובר.

אחריות:
- טעינת ההתראות מהשרת.
- שמירת ההתראות בזיכרון של React.
- חישוב מספר ההתראות שלא נקראו.
- סימון התראה אחת כנקראה.
- סימון כל ההתראות כנקראו.
- רענון ההתראות כאשר המשתמש חוזר לחלון האתר.
- ניקוי ההתראות לאחר התנתקות.
=========================================================
*/

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import PropTypes from "prop-types";

import { AuthContext } from "./AuthContext";

import {
  getNotifications,
  markAllNotificationsAsRead as markAllAsReadRequest,
  markNotificationAsRead as markAsReadRequest,
} from "../services/notificationService";

/*
---------------------------------------------------------
NotificationContext

מאפשר לקומפוננטות במערכת לקבל את ההתראות
והפעולות הקשורות אליהן.
---------------------------------------------------------
*/
export const NotificationContext = createContext(null);

/*
---------------------------------------------------------
normalizeNotification

תפקיד:
מנרמלת את נתוני ההתראה המתקבלים מ-MySQL.

MySQL עשוי להחזיר את isRead כמספר 0 או 1.
ה-Frontend משתמש בערך Boolean ברור.
---------------------------------------------------------
*/
function normalizeNotification(notification) {
  return {
    ...notification,
    isRead: Boolean(Number(notification.isRead)),
  };
}

/*
---------------------------------------------------------
NotificationProvider

תפקיד:
עוטפת את האפליקציה ומספקת מצב התראות משותף
ל-Header, לדף ההתראות ולדאשבורדים.
---------------------------------------------------------
*/
export function NotificationProvider({ children }) {
  const { user, isAuthenticated, isAuthReady } = useContext(AuthContext);

  const [notifications, setNotifications] = useState([]);

  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const [notificationError, setNotificationError] = useState("");

  /*
  ---------------------------------------------------------
  fetchNotifications

  תפקיד:
  טוענת את ההתראות של המשתמש המחובר מהשרת.

  המשתמש מזוהה באמצעות ה-Session.
  ---------------------------------------------------------
  */
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setNotificationError("");
      setIsLoadingNotifications(false);

      return;
    }

    try {
      setIsLoadingNotifications(true);
      setNotificationError("");

      const result = await getNotifications();

      if (!result.success) {
        throw new Error(result.message || "Failed to load notifications.");
      }

      const notificationsData = Array.isArray(result.notifications)
        ? result.notifications.map(normalizeNotification)
        : [];

      setNotifications(notificationsData);
    } catch (error) {
      console.error("Error loading notifications:", error);

      const serverMessage = error.response?.data?.message;

      setNotificationError(
        serverMessage ||
          error.message ||
          "An error occurred while loading notifications.",
      );
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [isAuthenticated]);

  /*
  ---------------------------------------------------------
  טעינת ההתראות לאחר סיום בדיקת ההתחברות

  userId נמצא ב-dependencies כדי שההתראות ייטענו
  מחדש כאשר משתמש אחר מתחבר באותו דפדפן.
  ---------------------------------------------------------
  */
  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    if (!isAuthenticated) {
      setNotifications([]);
      setNotificationError("");
      setIsLoadingNotifications(false);

      return;
    }

    fetchNotifications();
  }, [fetchNotifications, isAuthenticated, isAuthReady, user?.userId]);

  /*
  ---------------------------------------------------------
  רענון כאשר המשתמש חוזר לחלון

  כך המונה מתעדכן לאחר שהמשתמש חזר לאתר,
  בלי צורך לרענן ידנית את כל הדף.
  ---------------------------------------------------------
  */
  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const handleWindowFocus = () => {
      fetchNotifications();
    };

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [fetchNotifications, isAuthenticated]);

  /*
  ---------------------------------------------------------
  markAsRead

  תפקיד:
  מסמנת התראה אחת כנקראה בשרת ולאחר מכן
  מעדכנת מיד את ה-State המקומי.
  ---------------------------------------------------------
  */
  const markAsRead = useCallback(async (notificationId) => {
    const result = await markAsReadRequest(notificationId);

    if (!result.success) {
      throw new Error(result.message || "Failed to update notification.");
    }

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.notificationId === notificationId
          ? {
              ...notification,
              isRead: true,
            }
          : notification,
      ),
    );

    return result;
  }, []);

  /*
  ---------------------------------------------------------
  markAllAsRead

  תפקיד:
  מסמנת את כל ההתראות כנקראו בשרת ולאחר מכן
  מעדכנת את כל ההתראות ב-State.
  ---------------------------------------------------------
  */
  const markAllAsRead = useCallback(async () => {
    const result = await markAllAsReadRequest();

    if (!result.success) {
      throw new Error(result.message || "Failed to update notifications.");
    }

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        isRead: true,
      })),
    );

    return result;
  }, []);

  /*
  ---------------------------------------------------------
  unreadCount

  תפקיד:
  מחשב כמה התראות עדיין לא נקראו.
  ---------------------------------------------------------
  */
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  /*
  ---------------------------------------------------------
  contextValue

  תפקיד:
  מרכז את כל נתוני ההתראות והפעולות הזמינות
  לקומפוננטות המשתמשות ב-Context.
  ---------------------------------------------------------
  */
  const contextValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoadingNotifications,
      notificationError,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
    }),
    [
      notifications,
      unreadCount,
      isLoadingNotifications,
      notificationError,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
    ],
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

/*
---------------------------------------------------------
NotificationProvider.propTypes
---------------------------------------------------------
*/
NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
