/**
 * @file mailer.js
 * @description קובץ השירות האחראי על שליחת אימיילים ממערכת הספרייה באמצעות Nodemailer וחשבון Gmail.
 * מנהל את החיבור מול שרתי גוגל ומספק פונקציות גלובליות לשליחת הודעות לסטודנטים ולספרנים.
 *
 * כתובת המייל המערכתית: library-info@gmail.com
 * ספריות בשימוש: nodemailer
 */

const nodemailer = require("nodemailer");

/**
 * הגדרת הטרנספורטר (Transporter) של Nodemailer.
 * אובייקט זה אחראי על יצירת החיבור המאובטח מול שרתי ה-SMTP של גוגל
 * באמצעות פרוטוקול Gmail וסיסמת האפליקציה (App Password) שהוגדרה בחשבון.
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "libraryinfo2403@gmail.com",
    pass: "gswvbvqenwcnxiyp",
  },
});

/**
 * פונקציה אסינכרונית ראשית לשליחת אימייל מותאם אישית מהמערכת.
 *
 * @param {string} toEmail - כתובת המייל של הנמען (למשל, הסטודנט או המשתמש במערכת).
 * @param {string} subject - נושא ההודעה שיופיע בכותרת המייל.
 * @param {string} messageHtml - תוכן ההודעה בפורמט HTML (מאפשר עיצוב, כותרות וקישורים).
 * @returns {Promise<Object>} מחזיר אובייקט המציין האם השליחה הצליחה, יחד עם מזהה הודעה או פרטי שגיאה.
 */
const sendLibraryEmail = async (toEmail, subject, messageHtml) => {
  try {
    // הפעלת פקודת השליחה דרך הטרנספורטר המוגדר
    const info = await transporter.sendMail({
      from: '"מערכת הספרייה" <libraryinfo2403@gmail.com>', // השם שיופיע כשולח המייל
      to: toEmail, // כתובת הנמען
      subject: subject, // נושא המייל
      html: messageHtml, // גוף המייל המעוצב ב־HTML
    });

    // תיעוד הצלחה בקונסול של השרת
    console.log("המייל נשלח בהצלחה. מזהה הודעה:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    // טיפול במקרה של שגיאה בשליחה (למשל כתובת שגויה או בעיית תקשורת)
    console.error("שגיאה בשליחת המייל:", error);
    return { success: false, error: error.message };
  }
};

// ייצוא הפונקציות החוצה כדי שניתן יהיה לייבא ולהשתמש בהן בנתבים (Routes) השונים של השרת
module.exports = {
  sendLibraryEmail,
};
