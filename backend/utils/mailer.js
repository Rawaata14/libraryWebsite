/**
 * @file mailer.js
 *
 * @description
 * קובץ השירות האחראי על שליחת אימיילים
 * ממערכת הספרייה באמצעות Nodemailer וחשבון Gmail.
 *
 * הקובץ מנהל את החיבור מול שרתי Google ומספק
 * פונקציה מרכזית לשליחת הודעות למשתמשים.
 *
 * אבטחה:
 * כתובת המייל וסיסמת האפליקציה אינן נשמרות
 * ישירות בקוד.
 *
 * הערכים נקראים מתוך הקובץ:
 * backend/.env
 *
 * באמצעות משתני הסביבה:
 * EMAIL_USER
 * EMAIL_APP_PASSWORD
 *
 * ספריות בשימוש:
 * nodemailer
 */

const nodemailer = require("nodemailer");

/**
 * משתנה השומר את אובייקט ה-Transporter.
 *
 * ה-Transporter נוצר רק בפעם הראשונה שבה
 * המערכת באמת מנסה לשלוח מייל.
 *
 * לאחר מכן נעשה שימוש חוזר באותו אובייקט,
 * כדי לא ליצור חיבור חדש בכל פעולת שליחה.
 */
let transporter = null;

/**
 * getTransporter
 *
 * תפקיד:
 * יוצרת ומחזירה את אובייקט ה-Transporter
 * של Nodemailer.
 *
 * אובייקט זה אחראי על יצירת החיבור המאובטח
 * מול שרתי ה-SMTP של Google באמצעות Gmail
 * וסיסמת אפליקציה.
 *
 * פרטי ההתחברות מתקבלים ממשתני הסביבה
 * ולא נכתבים ישירות בקוד.
 *
 * אם כתובת המייל או סיסמת האפליקציה עדיין
 * אינן מוגדרות, הפונקציה מחזירה null.
 *
 * כך השרת יכול להמשיך לפעול וההתראות בתוך
 * האתר עדיין נשמרות, גם כאשר שירות המייל
 * עדיין אינו מוגדר.
 *
 * @returns {Object|null}
 * מחזירה את ה-Transporter של Nodemailer,
 * או null אם הגדרות המייל חסרות.
 */
function getTransporter() {
  const emailUser = process.env.EMAIL_USER;

  const emailAppPassword = process.env.EMAIL_APP_PASSWORD;

  /*
  בדיקה שפרטי ההתחברות הוגדרו.

  אם אחד מהערכים חסר:
  לא מנסים להתחבר ל-Gmail ולא מפילים
  את שרת ה-Backend.
  */
  if (!emailUser || !emailAppPassword) {
    return null;
  }

  /*
  יצירת ה-Transporter רק אם הוא עדיין
  לא נוצר קודם לכן.
  */
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",

      auth: {
        user: emailUser,

        pass: emailAppPassword,
      },
    });
  }

  return transporter;
}

/**
 * sendLibraryEmail
 *
 * פונקציה אסינכרונית מרכזית לשליחת מייל
 * מותאם אישית ממערכת הספרייה.
 *
 * הפונקציה יכולה לקבל תוכן HTML וגם תוכן
 * טקסט רגיל כחלופה.
 *
 * תוכן הטקסט חשוב עבור תוכנות דואר שאינן
 * מציגות HTML ועבור נגישות.
 *
 * אם שירות המייל אינו מוגדר:
 * הפונקציה מחזירה תוצאת כישלון מסודרת
 * ואינה מפילה את השרת.
 *
 * @param {string} toEmail
 * כתובת המייל של הנמען, למשל המשתמש
 * או הסטודנט במערכת.
 *
 * @param {string} subject
 * נושא ההודעה שיופיע בכותרת המייל.
 *
 * @param {string} messageHtml
 * תוכן ההודעה בפורמט HTML.
 *
 * @param {string} messageText
 * תוכן חלופי בפורמט טקסט רגיל.
 *
 * @returns {Promise<Object>}
 * מחזירה אובייקט המציין האם השליחה הצליחה.
 *
 * במקרה של הצלחה:
 * {
 *   success: true,
 *   messageId: "..."
 * }
 *
 * במקרה של כישלון:
 * {
 *   success: false,
 *   error: "..."
 * }
 */
async function sendLibraryEmail(
  toEmail,
  subject,
  messageHtml,
  messageText = "",
) {
  /*
  קבלת ה-Transporter המוגדר.

  אם אין עדיין הגדרות מייל, יוחזר null.
  */
  const mailTransporter = getTransporter();

  /*
  טיפול במקרה שבו כתובת המייל או סיסמת
  האפליקציה עדיין לא הוגדרו ב-.env.
  */
  if (!mailTransporter) {
    return {
      success: false,

      error:
        "Email is not configured. " +
        "Add EMAIL_USER and " +
        "EMAIL_APP_PASSWORD.",
    };
  }

  try {
    /*
    הפעלת פעולת השליחה באמצעות
    ה-Transporter של Nodemailer.
    */
    const info = await mailTransporter.sendMail({
      /*
        השם שיופיע אצל המשתמש כשולח
        ההודעה, יחד עם כתובת המייל
        שהוגדרה ב-.env.
        */
      from: `"Library System" ` + `<${process.env.EMAIL_USER}>`,

      /*
        כתובת הנמען.
        */
      to: toEmail,

      /*
        נושא המייל.
        */
      subject,

      /*
        תוכן טקסט רגיל.

        אם לא התקבל תוכן טקסט,
        השדה לא יישלח ל-Nodemailer.
        */
      text: messageText || undefined,

      /*
        תוכן המייל המעוצב ב-HTML.

        אם לא התקבל תוכן HTML,
        השדה לא יישלח ל-Nodemailer.
        */
      html: messageHtml || undefined,
    });

    /*
    תיעוד הצלחה בקונסול של השרת.

    אין להציג כאן כתובות מייל,
    סיסמאות או מידע אישי.
    */
    console.log("Email sent successfully. Message ID:", info.messageId);

    return {
      success: true,

      messageId: info.messageId,
    };
  } catch (error) {
    /*
    טיפול במקרה של שגיאה בשליחה.

    לדוגמה:
    - בעיית תקשורת.
    - כתובת נמען לא תקינה.
    - סיסמת אפליקציה לא תקינה.
    - חסימה מצד שירות Gmail.
    */
    console.error("Error sending library email:", error.message);

    return {
      success: false,

      error: error.message,
    };
  }
}

/*
ייצוא הפונקציה כדי שקובצי Routes ושירותים
אחרים במערכת יוכלו לשלוח מיילים בלי ליצור
Transporter חדש בכל קובץ.
*/
module.exports = {
  sendLibraryEmail,
};
