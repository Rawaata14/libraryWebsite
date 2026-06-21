const express = require("express");
const session = require("express-session");
const router = express.Router();

const multer = require("multer");
const path = require("path");
const fs = require("fs");

/*
  יצירת תיקיית שמירת תמונות פרופיל
  לוודא שקיימת תיקייה בשרת עבור תמונות פרופיל.

  למה נוצר:
  אם התיקייה לא קיימת, multer לא יוכל לשמור את הקבצים.
*/
const profileImagesDir = path.join(__dirname, "../uploads/profile-images");

if (!fs.existsSync(profileImagesDir)) {
  fs.mkdirSync(profileImagesDir, { recursive: true });
}

/*
  הגדרת multer לשמירת תמונות פרופיל
  קביעת מיקום שמירת הקובץ ושם הקובץ.

  למה נוצר:
  כדי לאפשר העלאת תמונה מהמחשב של המשתמש
  ולשמור אותה בצורה מסודרת בשרת.
*/
const storage = multer.diskStorage({
  /*
    destination
    קובע באיזו תיקייה לשמור את תמונת הפרופיל.
  */
  destination: (req, file, cb) => {
    cb(null, profileImagesDir);
  },

  /*
    filename
    יוצר שם ייחודי לתמונה כדי למנוע דריסה של קבצים קיימים.
  */
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;

    cb(null, uniqueName);
  },
});

/*
  fileFilter
  מאפשר העלאת קבצי תמונה בלבד.

  למה נוצר:
  כדי למנוע העלאה של קבצים לא מתאימים כמו PDF או EXE.
*/
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

/*
  upload
  middleware של multer שמטפל בהעלאת הקובץ.
*/
const upload = multer({
  storage,
  fileFilter,
});

// const authQueries = require("../database/queries/authorization");

// Route for user registration
router.post("/register", async (req, res) => {
  try {
    const register = require("../database/queries/authorization").registerUser;
    const detailsToInsert = req.body;
    const result = await register(detailsToInsert);
    if (result.success) {
      req.session.user = result.user;
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in registration:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route for user login
router.post("/login", async (req, res) => {
  try {
    const login = require("../database/queries/authorization").loginUser;
    const { email, password } = req.body;
    const result = await login(email, password);
    if (result.success) {
      req.session.user = result.user; // שמירת פרטי המשתמש בסשן
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route for checking authentication status
router.get("/check-auth", async (req, res) => {
  try {
    if (req.session && req.session.user) {
      req.session.user = req.session.user; // שמירת פרטי המשתמש בסשן
      res.status(200).json(req.session.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  } catch (error) {
    console.error("Error in checking authentication:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route for user logout
router.post("/logout", (req, res) => {
  try {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error in logout:", err);
          return res.status(500).json({ message: "Internal server error" });
        }
        res.clearCookie("connect.sid");
        res.status(200).json({ message: "Logged out successfully" });
      });
    } else {
      res.status(400).json({ message: "No active session" });
    }
  } catch (error) {
    console.error("Error in logout:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/*
  Route: PUT /user/profile-image
  העלאת תמונת פרופיל חדשה למשתמש המחובר.

  איך זה עובד:
  - בודק שיש משתמש מחובר בסשן.
  - מקבל קובץ בשם profileImage.
  - שומר את הקובץ בתיקיית uploads/profile-images.
  - מעדכן במסד הנתונים את שם התמונה.
  - מעדכן גם את פרטי המשתמש בסשן.
*/
router.put(
  "/profile-image",
  upload.single("profileImage"),
  async (req, res) => {
    try {
      if (!req.session || !req.session.user) {
        return res.status(401).json({
          success: false,
          message: "User is not authenticated",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image file uploaded",
        });
      }

      const updateProfileImage =
        require("../database/queries/authorization").updateProfileImage;

      const userEmail = req.session.user.email;

      const profileImageName = req.file.filename;

      const result = await updateProfileImage(userEmail, profileImageName);

      if (result.success) {
        req.session.user = result.user;

        return res.status(200).json(result);
      }

      return res.status(400).json(result);
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
Route: PUT /user/profile

תפקיד:
עדכון פרטים אישיים של המשתמש המחובר.

הנתונים שניתן לעדכן:
- fullName
- email
- phone
- password

לאחר עדכון מוצלח:
מתבצע עדכון גם של session המשתמש.
---------------------------------------------------------
*/
router.put("/profile", async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: "User is not authenticated",
      });
    }

    const updateUserProfile =
      require("../database/queries/authorization").updateUserProfile;

    const currentEmail = req.session.user.email;

    const updatedData = req.body;

    const result = await updateUserProfile(currentEmail, updatedData);

    if (result.success) {
      req.session.user = result.user;

      return res.status(200).json(result);
    }

    return res.status(400).json(result);
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
Route: GET /user/all

תפקיד:
שליפת כל המשתמשים עבור הספרן.
---------------------------------------------------------
*/
router.get("/all", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "librarian") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const getAllUsers =
      require("../database/queries/authorization").getAllUsers;

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
Route: PUT /user/status

תפקיד:
עדכון סטטוס משתמש על ידי הספרן.
---------------------------------------------------------
*/
router.put("/status", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "librarian") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const updateUserStatus =
      require("../database/queries/authorization").updateUserStatus;

    const { email, status } = req.body;

    const result = await updateUserStatus(email, status);

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error("Error updating user status:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/*
---------------------------------------------------------
Route: GET /user/all

תפקיד:
שליפת כל המשתמשים במערכת עבור דף ניהול המשתמשים של הספרן.

הרשאה:
רק משתמש עם role = librarian יכול לגשת לנתיב הזה.
---------------------------------------------------------
*/
router.get("/all", async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: "User is not authenticated",
      });
    }

    if (req.session.user.role !== "librarian") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Librarian privileges required.",
      });
    }

    const getAllUsers =
      require("../database/queries/authorization").getAllUsers;

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
Route: GET /user/dashboard-stats

תפקיד:
מחזיר נתוני דשבורד אמיתיים עבור המשתמש המחובר.
---------------------------------------------------------
*/
router.get("/dashboard-stats", async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: "User is not authenticated",
      });
    }

    const getUserDashboardStats =
      require("../database/queries/authorization")
        .getUserDashboardStats;

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

module.exports = router;
