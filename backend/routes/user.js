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
const multer = require("multer");
const path = require("path");
const fs = require("fs");

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
מוודאת שתיקיית שמירת התמונות קיימת לפני ש-multer
מנסה לשמור בה קבצים.
---------------------------------------------------------
*/
if (!fs.existsSync(profileImagesDirectory)) {
  fs.mkdirSync(profileImagesDirectory, { recursive: true });
}

/*
---------------------------------------------------------
profileImageStorage

תפקיד:
מגדירה היכן תישמר תמונת הפרופיל ומה יהיה שם הקובץ.

שם הקובץ מורכב מזמן ההעלאה ומספר אקראי,
כדי למנוע דריסה של תמונות קיימות.
---------------------------------------------------------
*/
const profileImageStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, profileImagesDirectory);
  },

  filename: (req, file, callback) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    const fileExtension = path.extname(file.originalname).toLowerCase();

    callback(null, `${uniqueSuffix}${fileExtension}`);
  },
});

/*
---------------------------------------------------------
profileImageFilter

תפקיד:
מאפשרת העלאת קובצי תמונה בלבד.
---------------------------------------------------------
*/
function profileImageFilter(req, file, callback) {
  if (!file.mimetype.startsWith("image/")) {
    return callback(new Error("Only image files are allowed"), false);
  }

  return callback(null, true);
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
  },
});

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
router.post("/forgot-password", async (req, res) => {
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
router.post("/reset-password", async (req, res) => {
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
יוצרת חשבון משתמש חדש ושומרת אותו ב-Session.
---------------------------------------------------------
*/
router.post("/register", async (req, res) => {
  try {
    const result = await registerUser(req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    req.session.user = result.user;

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
מבצעת התחברות ושומרת את המשתמש הבטוח ב-Session.
---------------------------------------------------------
*/
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await loginUser(email, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    req.session.user = result.user;

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
---------------------------------------------------------
*/
router.post("/logout", requireAuth, (req, res) => {
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
מעלה תמונת פרופיל ומעדכנת את שם הקובץ במסד.

הגנות:
- המשתמש חייב להיות מחובר.
- ניתן להעלות תמונה אחת בלבד.
- גודל התמונה מוגבל ל-5MB.
---------------------------------------------------------
*/
router.put(
  "/profile-image",
  requireAuth,
  handleProfileImageUpload,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image file was uploaded",
        });
      }

      const result = await updateProfileImage(
        req.session.user.email,
        req.file.filename,
      );

      if (!result.success) {
        return res.status(400).json(result);
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
    const result = await updateUserProfile(req.session.user.email, req.body);

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
