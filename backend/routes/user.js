/*
=========================================================
user.js

תיאור הקובץ:
Routes הקשורים למשתמשים ולניהול החשבון.

הקובץ אחראי על:
- הרשמה והתחברות.
- בדיקת Session והתנתקות.
- עדכון פרטי משתמש ותמונת פרופיל.
- שליפת משתמשים ועדכון סטטוס על ידי ספרן.
- שליפת נתוני הדשבורד של המשתמש.
=========================================================
*/

const express = require("express");
const { rateLimit } = require("express-rate-limit");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { randomUUID } = require("crypto");

const {
  registerUser,
  loginUser,
  updateProfileImage,
  updateUserProfile,
  getAllUsers,
  updateUserStatus,
  getUserDashboardStats,
  createPasswordResetToken,
  resetUserPassword,
} = require("../database/queries/authorization");
const { sendPasswordResetEmail } = require("../utils/emailService");

const { requireAuth, requireLibrarian } = require("../middleware/auth");
const { isValidEmail } = require("../utils/formatters");

const router = express.Router();

/*
---------------------------------------------------------
createAuthenticatedSession

תפקיד:
יוצרת Session חדש עבור משתמש לאחר התחברות
או הרשמה מוצלחת.

פרמטרים:
- req: בקשת המשתמש.
- user: אובייקט המשתמש הבטוח.

ערך מוחזר:
- Promise שמסתיים לאחר שמירת ה-Session.
- במקרה של שגיאה ה-Promise נדחה.

לוגיקה:
- מחדשת את מזהה ה-Session.
- שומרת את פרטי המשתמש ב-Session החדש.
- שומרת את ה-Session לפני החזרת תשובה ללקוח.
- מסייעת במניעת מתקפות Session Fixation.
---------------------------------------------------------
*/
function createAuthenticatedSession(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        return reject(error);
      }

      req.session.user = user;

      req.session.save((saveError) => {
        if (saveError) {
          return reject(saveError);
        }

        return resolve();
      });
    });
  });
}

/*
---------------------------------------------------------
loginLimiter

תפקיד:
מגביל ניסיונות התחברות כושלים למערכת ומסייע
בהגנה מפני ניסיונות ניחוש סיסמאות.

הגבלות:
- עד 50 ניסיונות כושלים בתוך 15 דקות.
- התחברויות מוצלחות אינן נספרות במכסה.
- חריגה מהמכסה מחזירה קוד HTTP 429.
- המכסה משותפת לכל המשתמשים בסביבת הבטא.
---------------------------------------------------------
*/
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,

  keyGenerator: () => "beta-login",

  message: {
    success: false,
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
});

/*
---------------------------------------------------------
forgotPasswordLimiter

תפקיד:
מגביל את מספר הבקשות לשחזור סיסמה ומסייע
במניעת הצפת המערכת ושליחת מיילים מרובים.

הגבלות:
- עד 20 בקשות בתוך שעה.
- כל הבקשות נספרות במכסה.
- חריגה מהמכסה מחזירה קוד HTTP 429.
- המכסה משותפת לכל המשתמשים בסביבת הבטא.
---------------------------------------------------------
*/
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,

  keyGenerator: () => "beta-forgot-password",

  message: {
    success: false,
    message: "Too many password reset requests. Please try again later.",
  },
});

/*
---------------------------------------------------------
resetPasswordLimiter

תפקיד:
מגביל את מספר הבקשות לאיפוס סיסמה ומסייע
במניעת ניסיונות חוזרים לאימות אסימוני שחזור
ובהפחתת עומס על השרת.

הגבלות:
- עד 30 בקשות בתוך 15 דקות.
- כל הבקשות נספרות במכסה.
- חריגה מהמכסה מחזירה קוד HTTP 429.
- המכסה משותפת לכל המשתמשים בסביבת הבטא.
---------------------------------------------------------
*/
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,

  keyGenerator: () => "beta-reset-password",

  message: {
    success: false,
    message: "Too many password reset attempts. Please try again later.",
  },
});

/*
---------------------------------------------------------
registerLimiter

תפקיד:
מגביל את מספר בקשות ההרשמה למערכת ומסייע
במניעת יצירת חשבונות המונית והצפת השרת.

הגבלות:
- עד 30 בקשות הרשמה בתוך שעה.
- כל הבקשות נספרות במכסה.
- חריגה מהמכסה מחזירה קוד HTTP 429.
- המכסה משותפת לכל המשתמשים בסביבת הבטא.
---------------------------------------------------------
*/
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,

  keyGenerator: () => "beta-register",

  message: {
    success: false,
    message: "Too many registration attempts. Please try again later.",
  },
});

/*
---------------------------------------------------------
profileImageLimiter

תפקיד:
מגביל את מספר הבקשות להעלאת תמונות פרופיל
ומסייע בהפחתת עומס על זיכרון השרת.

הגבלות:
- עד 30 בקשות בתוך 15 דקות.
- כל הבקשות נספרות במכסה.
- חריגה מהמכסה מחזירה קוד HTTP 429.
- המכסה נפרדת לכל משתמש מחובר.
---------------------------------------------------------
*/
const profileImageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,

  // משתמש מחובר מקבל מכסה נפרדת; כך משתמש אחד אינו חוסם את כולם.
  keyGenerator: (req) => `profile-image-user-${req.session.user.userId}`,

  // החזרת תגובת חסימה לאחר סיום קריאת הבקשה
  handler: (req, res) => {
    const sendRateLimitResponse = () => {
      if (res.destroyed || res.headersSent) {
        return;
      }

      return res.status(429).json({
        success: false,
        message: "Too many image upload requests. Please try again later.",
      });
    };

    // אם תוכן הבקשה כבר נקרא, מחזירים תגובה מיד
    if (req.readableEnded) {
      return sendRateLimitResponse();
    }

    // המתנה לסיום קריאת תוכן הבקשה ללא שמירת הקובץ
    req.once("end", sendRateLimitResponse);
    req.resume();
  },
});

/*
=========================================================
הגדרת העלאת תמונות פרופיל
=========================================================
*/

const profileImagesDirectory = path.join(
  __dirname,
  "../uploads/profile-images",
);

/*
---------------------------------------------------------
יצירת תיקיית תמונות הפרופיל

תפקיד:
מוודאת שתיקיית שמירת התמונות קיימת לפני שמירת
קבצים שאומתו בדיסק.
---------------------------------------------------------
*/
if (!fs.existsSync(profileImagesDirectory)) {
  fs.mkdirSync(profileImagesDirectory, { recursive: true });
}

/*
---------------------------------------------------------
profileImageStorage

תפקיד:
מגדירה אחסון זמני של תמונת הפרופיל בזיכרון השרת.

לוגיקה:
- הקובץ נשמר זמנית בזיכרון כ-Buffer.
- הקובץ אינו נשמר ישירות בתיקיית התמונות הציבורית.
- שמירת הקובץ בדיסק תתבצע רק לאחר אימות תוכנו.
---------------------------------------------------------
*/
const profileImageStorage = multer.memoryStorage();

/*
---------------------------------------------------------
profileImageFilter

תפקיד:
מסננת קבצים המועלים כתמונות פרופיל.

פרמטרים:
- req: בקשת המשתמש.
- file: פרטי הקובץ שהתקבל.
- callback: פונקציה המאשרת או דוחה את הקובץ.

הגנות:
- מאפשרת רק תמונות JPEG, PNG ו-WebP.
- בודקת התאמה בין סיומת הקובץ ל-MIME Type.
- חוסמת קובצי SVG וסוגי קבצים שאינם מורשים.
---------------------------------------------------------
*/
function profileImageFilter(req, file, callback) {
  const allowedTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
  };

  const extension = path.extname(file.originalname).toLowerCase();

  if (
    !Object.hasOwn(allowedTypes, extension) ||
    allowedTypes[extension] !== file.mimetype
  ) {
    return callback(new Error("Only image files are allowed"), false);
  }

  return callback(null, true);
}

/*
---------------------------------------------------------
validateProfileImageContent

תפקיד:
מאמתת את סוג התמונה לפי התוכן הבינארי של הקובץ.

פרמטרים:
- file: הקובץ שהתקבל באמצעות multer.

ערך מוחזר:
- true: סוג הקובץ זוהה ותואם לסוג המותר.
- false: סוג הקובץ אינו תקין או אינו מזוהה.

לוגיקה:
- טוענת את ספריית file-type באמצעות import דינמי.
- מזהה את סוג הקובץ מתוך ה-Buffer.
- בודקת שסוג הקובץ נמצא ברשימת הסוגים המותרים.
- בודקת התאמה בין הסוג שזוהה ל-MIME Type שהתקבל.
---------------------------------------------------------
*/
async function validateProfileImageContent(file) {
  if (
    !file ||
    !Buffer.isBuffer(file.buffer) ||
    file.buffer.length === 0 ||
    file.buffer.length > 5 * 1024 * 1024
  ) {
    return false;
  }

  const { fileTypeFromBuffer } = await import("file-type");

  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

  let detectedType;

  try {
    detectedType = await fileTypeFromBuffer(file.buffer);
  } catch (error) {
    return false;
  }

  if (!detectedType) {
    return false;
  }

  return (
    allowedMimeTypes.includes(detectedType.mime) &&
    detectedType.mime === file.mimetype
  );
}

/*
---------------------------------------------------------
saveProfileImage

תפקיד:
שומרת תמונת פרופיל בדיסק לאחר שעברה אימות.

פרמטרים:
- file: קובץ התמונה שהתקבל באמצעות multer.

ערך מוחזר:
- שם הקובץ שנשמר בשרת.

לוגיקה:
- קובעת את סיומת הקובץ לפי סוג התמונה שאומת.
- מייצרת שם ייחודי באמצעות UUID.
- בונה את נתיב השמירה בתיקיית תמונות הפרופיל.
- שומרת את תוכן ה-Buffer בדיסק באופן אסינכרוני.
- מונעת דריסה של קובץ קיים.
---------------------------------------------------------
*/
async function saveProfileImage(file) {
  const allowedExtensions = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };

  const extension = allowedExtensions[file.mimetype];

  if (!extension) {
    throw new Error("Unsupported image type");
  }

  const filename = `${randomUUID()}${extension}`;
  const filePath = path.join(profileImagesDirectory, filename);

  await fs.promises.writeFile(filePath, file.buffer, {
    flag: "wx",
  });

  return filename;
}

/*
---------------------------------------------------------
deleteProfileImage

תפקיד:
מוחקת תמונת פרופיל שנשמרה בדיסק אך אינה נדרשת.

פרמטרים:
- filename: שם הקובץ המיועד למחיקה.

ערך מוחזר:
- ללא ערך מוחזר.

לוגיקה:
- מוודאת שהתקבל שם קובץ תקין ללא נתיב.
- בונה את נתיב הקובץ בתיקיית תמונות הפרופיל.
- מוחקת את הקובץ באופן אסינכרוני.
- מתעלמת משגיאה כאשר הקובץ אינו קיים.
- מתעדת שגיאות מחיקה אחרות בשרת.
---------------------------------------------------------
*/
async function deleteProfileImage(filename) {
  if (
    typeof filename !== "string" ||
    !filename ||
    path.basename(filename) !== filename ||
    filename === "." ||
    filename === ".."
  ) {
    return;
  }

  const filePath = path.join(profileImagesDirectory, filename);

  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Error deleting profile image:", error);
    }
  }
}

/*
---------------------------------------------------------
uploadProfileImage

תפקיד:
מטפלת בהעלאת תמונת פרופיל אחת בגודל של עד 5MB.
---------------------------------------------------------
*/
const uploadProfileImage = multer({
  storage: profileImageStorage,
  fileFilter: profileImageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 5,
    parts: 6,
    fieldNameSize: 100,
    fieldSize: 16 * 1024,
  },
});

/*
---------------------------------------------------------
handleProfileImageUpload

תפקיד:
מטפלת בבקשת העלאת תמונה ובשגיאות Multer.

פרמטרים:
- req, res: הבקשה והתגובה.
- next: המשך שרשרת ה-Middleware.

ערך מוחזר ולוגיקה:
- ממשיכה לטיפול הבא בהצלחה.
- מחזירה HTTP 400 בשגיאות העלאה מוכרות.
- מעבירה שגיאות אחרות למנגנון הטיפול בשגיאות.
---------------------------------------------------------
*/
function handleProfileImageUpload(req, res, next) {
  uploadProfileImage.single("profileImage")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Image size must not exceed 5MB",
        });
      }

      if (
        error.code === "LIMIT_FILE_COUNT" ||
        error.code === "LIMIT_PART_COUNT" ||
        error.code === "LIMIT_FIELD_COUNT" ||
        error.code === "LIMIT_FIELD_KEY" ||
        error.code === "LIMIT_FIELD_VALUE"
      ) {
        return res.status(400).json({
          success: false,
          message: "Image upload contains too many or oversized form fields",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Invalid image upload",
      });
    }

    if (error.message === "Only image files are allowed") {
      return res.status(400).json({
        success: false,
        message: "Only image files are allowed",
      });
    }

    return next(error);
  });
}

/*
=========================================================
Routes ציבוריים
=========================================================
*/

/*
---------------------------------------------------------
POST /user/forgot-password

תפקיד:
יוצר אסימון שחזור ושולח קישור לאימייל.
---------------------------------------------------------
*/
router.post("/forgot-password", forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    const resetData = await createPasswordResetToken(email);

    if (resetData) {
      await sendPasswordResetEmail(resetData.email, resetData.token);
    }

    return res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a password reset link will be sent.",
    });
  } catch (error) {
    console.error("Error requesting password reset:", error);

    return res.status(500).json({
      success: false,
      message: "Could not process password reset request",
    });
  }
});

/*
---------------------------------------------------------
POST /user/reset-password

תפקיד:
מקבל אסימון שחזור וסיסמה חדשה,
מאמת את האסימון ומעדכן את הסיסמה.
---------------------------------------------------------
*/
router.post("/reset-password", resetPasswordLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (
      typeof token !== "string" ||
      typeof newPassword !== "string" ||
      !token ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    const result = await resetUserPassword(token, newPassword);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error resetting password:", error);

    return res.status(500).json({
      success: false,
      message: "Could not reset password",
    });
  }
});

/*
---------------------------------------------------------
POST /user/register

תפקיד:
יוצרת חשבון משתמש חדש ומחדשת את ה-Session
לאחר הרשמה מוצלחת.
---------------------------------------------------------
*/
router.post("/register", registerLimiter, async (req, res) => {
  try {
    const result = await registerUser(req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // יצירת Session חדש לאחר הרשמה מוצלחת
    await createAuthenticatedSession(req, result.user);

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error in registration:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/*
---------------------------------------------------------
POST /user/login

תפקיד:
מבצעת התחברות, מחדשת את מזהה ה-Session
ושומרת בו את פרטי המשתמש הבטוחים.
---------------------------------------------------------
*/
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await loginUser(email, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    // יצירת Session חדש לאחר התחברות מוצלחת
    await createAuthenticatedSession(req, result.user);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in login:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/*
=========================================================
Routes למשתמש מחובר
=========================================================
*/

/*
---------------------------------------------------------
GET /user/check-auth

תפקיד:
מחזירה את המשתמש המחובר מתוך ה-Session.
---------------------------------------------------------
*/
router.get("/check-auth", requireAuth, (req, res) => {
  return res.status(200).json(req.session.user);
});

/*
---------------------------------------------------------
POST /user/logout

תפקיד:
מוחקת את ה-Session ואת עוגיית ההתחברות.

לוגיקה:
- מאפשרת התנתקות גם למשתמש שחשבונו נחסם.
- מוחקת את ה-Session בצד השרת.
- מוחקת את עוגיית ההתחברות בצד הלקוח.

הגנות:
- אינה מעניקה גישה למידע או לפעולות מוגנות.
- מאפשרת ביטול Session ללא תלות בסטטוס החשבון.
---------------------------------------------------------
*/
router.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Error in logout:", error);

      return res.status(500).json({
        success: false,
        message: "Could not log out",
      });
    }

    res.clearCookie("connect.sid", {
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  });
});

/*
---------------------------------------------------------
PUT /user/profile-image

תפקיד:
מעלה תמונת פרופיל ומעדכנת את שם הקובץ במסד הנתונים.

הגנות:
- מגבילה את מספר בקשות ההעלאה ל-30 בתוך 15 דקות.
- המשתמש חייב להיות מחובר.
- ניתן להעלות תמונה אחת בלבד.
- גודל התמונה מוגבל ל-5MB.
- מאפשרת תמונות JPEG, PNG ו-WebP בלבד.
- בודקת התאמה בין סיומת הקובץ ל-MIME Type.
- מאמתת את החתימה הבינארית של הקובץ.
- שומרת את התמונה בדיסק רק לאחר שעברה אימות.
- מייצרת שם קובץ ייחודי באמצעות UUID.

לוגיקה:
- מחיקת התמונה החדשה רק כאשר ידוע שלא נשמרה במסד הנתונים.
- קבלת התמונה ואחסונה הזמני בזיכרון.
- אימות החתימה הבינארית.
- שמירת התמונה בדיסק.
- עדכון שם הקובץ במסד הנתונים.
- עדכון פרטי המשתמש ב-Session.
---------------------------------------------------------
*/
router.put(
  "/profile-image",
  requireAuth,
  profileImageLimiter,
  handleProfileImageUpload,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image file was uploaded",
        });
      }
      // אימות סוג התמונה לפי התוכן הבינארי של הקובץ
      const isValidImage = await validateProfileImageContent(req.file);

      if (!isValidImage) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid image content. Only JPEG, PNG and WebP images are allowed.",
        });
      }

      // שמירת התמונה בדיסק לאחר שעברה אימות
      const filename = await saveProfileImage(req.file);

      // עדכון שם התמונה במסד הנתונים
      const result = await updateProfileImage(
        req.session.user.userId,
        filename,
      );

      if (!result.success) {
        // מחיקת התמונה רק כאשר ידוע שלא נשמרה במסד
        if (result.safeToDeleteImage === true) {
          await deleteProfileImage(filename);
        }

        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      req.session.user = result.user;

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error uploading profile image:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

/*
---------------------------------------------------------
PUT /user/profile

תפקיד:
מעדכנת את הפרטים האישיים של המשתמש המחובר
ומעדכנת גם את המשתמש השמור ב-Session.
---------------------------------------------------------
*/
router.put("/profile", requireAuth, async (req, res) => {
  try {
    const result = await updateUserProfile(req.session.user.userId, req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    req.session.user = result.user;

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error updating profile:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/*
---------------------------------------------------------
GET /user/dashboard-stats

תפקיד:
מחזירה את נתוני הדשבורד עבור המשתמש המחובר.
---------------------------------------------------------
*/
router.get("/dashboard-stats", requireAuth, async (req, res) => {
  try {
    const result = await getUserDashboardStats(req.session.user.userId);

    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("Error loading user dashboard:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/*
=========================================================
Routes לספרן בלבד
=========================================================
*/

/*
---------------------------------------------------------
GET /user/all

תפקיד:
מחזירה את כל המשתמשים עבור דף ניהול המשתמשים.
---------------------------------------------------------
*/
router.get("/all", requireLibrarian, async (req, res) => {
  try {
    const result = await getAllUsers();

    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("Error getting users:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/*
---------------------------------------------------------
PUT /user/status

תפקיד:
מאפשרת לספרן לעדכן את סטטוס המשתמש.

הגנות:
- requireLibrarian מוודאת שהמשתמש מחובר.
- requireLibrarian מוודאת שהמשתמש הוא ספרן.
- האימייל של הספרן נשלח ל-Query כדי למנוע חסימה עצמית.
---------------------------------------------------------
*/
router.put("/status", requireLibrarian, async (req, res) => {
  try {
    const { email, status } = req.body;

    const result = await updateUserStatus(
      email,
      status,
      req.session.user.email,
    );

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error("Error updating user status:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
