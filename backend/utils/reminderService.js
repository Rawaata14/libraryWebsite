/*
=========================================================
reminderService.js

תיאור הקובץ:
שירות לבדיקת הזמנות מקום שעומדות להסתיים
ושליחת תזכורת למשתמש.

אחריות:
- שליפת הזמנות שמסתיימות בקרוב.
- יצירת תוכן התזכורת.
- שליחת המייל באמצעות שירות mailer המרכזי.
- מניעת קריסת השרת כאשר שליחת מייל נכשלת.

השירות אינו יוצר Transporter בעצמו.
כל פעולות המייל עוברות דרך:
backend/utils/mailer.js
=========================================================
*/

const reservationQueries = require("../database/queries/reservationQueries");

const { sendLibraryEmail } = require("../utils/mailer");

/*
---------------------------------------------------------
checkAndSendExpirationReminders

תפקיד:
בודקת אילו הזמנות מקום מסתיימות בעוד
כ-15 דקות ושולחת תזכורת למשתמש המתאים.

למה הפונקציה נוצרה:
המשתמש צריך לקבל זמן להתארגן לפני סיום
השימוש במקום ולפני החזרת ספרים ששוריינו
במסגרת אותה הזמנה.

אם אין הזמנות מתאימות:
הפונקציה מסתיימת בלי לבצע פעולה.

אם שליחת מייל נכשלת:
השגיאה נרשמת בקונסול אך השרת ממשיך לפעול.
---------------------------------------------------------
*/
async function checkAndSendExpirationReminders() {
  try {
    /*
    שליפת ההזמנות שמסתיימות בקרוב
    משכבת השאילתות.
    */
    const result = await reservationQueries.getReservationsEndingIn15Minutes();

    /*
    אם השאילתה נכשלה או שאין הזמנות
    מתאימות, אין צורך להמשיך.
    */
    if (
      !result.success ||
      !Array.isArray(result.data) ||
      result.data.length === 0
    ) {
      return;
    }

    /*
    מעבר על כל ההזמנות שנמצאו.

    משתמשים בלולאת for...of כדי להמתין
    לכל שליחת מייל ולא להשאיר Promises
    שאינם מטופלים.
    */
    for (const reservation of result.data) {
      /*
      אם למשתמש אין כתובת מייל,
      מדלגים על ההזמנה.
      */
      if (!reservation.userEmail) {
        continue;
      }

      const subject = "תזכורת: הזמנת הכיסא שלך " + "עומדת להסתיים בעוד 15 דקות";

      const textMessage =
        `היי ${reservation.fullName},\n\n` +
        `הזמנת כיסא ${reservation.seatId} ` +
        "תסתיים בעוד כ-15 דקות.\n\n" +
        "אם שוריין ספר במסגרת ההזמנה, " +
        "יש להחזיר אותו לפני סיום הזמן.\n\n" +
        "צוות הספרייה.";

      /*
      תוכן HTML מעוצב למייל.

      התוכן מבוסס על אותם פרטים שמופיעים
      בגרסת הטקסט.
      */
      const htmlMessage = `
        <div
          dir="rtl"
          style="
            font-family: Arial, sans-serif;
            line-height: 1.7;
            color: #3f2925;
          "
        >
          <h2 style="color: #743b32;">
            תזכורת ממערכת הספרייה
          </h2>

          <p>
            היי ${reservation.fullName},
          </p>

          <p>
            הזמנת כיסא
            <strong>${reservation.seatId}</strong>
            עומדת להסתיים בעוד כ-15 דקות.
          </p>

          <p>
            אם שוריין ספר במסגרת ההזמנה,
            יש להחזיר אותו לפני סיום הזמן.
          </p>

          <p>
            בברכה,<br>
            <strong>צוות הספרייה</strong>
          </p>
        </div>
      `;

      /*
      שליחת המייל באמצעות השירות המרכזי.

      השירות מחזיר success=false כאשר
      הגדרות המייל חסרות, בלי להפיל את השרת.
      */
      const emailResult = await sendLibraryEmail(
        reservation.userEmail,
        subject,
        htmlMessage,
        textMessage,
      );

      /*
      רישום תקלה לצורכי בדיקה.

      אין לעצור את הלולאה, משום שייתכן
      שאפשר לשלוח מייל למשתמשים אחרים.
      */
      if (!emailResult.success) {
        console.error("Expiration reminder was not sent:", {
          reservationId: reservation.reservationId,

          error: emailResult.error,
        });
      }
    }
  } catch (error) {
    /*
    טיפול בשגיאה כללית בתהליך.

    הפונקציה מופעלת ברקע ולכן אסור ששגיאה
    בה תגרום לקריסת שרת ה-Backend.
    */
    console.error("Error in expiration reminder workflow:", error);
  }
}

/*
ייצוא הפונקציה כדי ש-app.js יוכל להפעיל
את בדיקת התזכורות במחזוריות.
*/
module.exports = {
  checkAndSendExpirationReminders,
};
