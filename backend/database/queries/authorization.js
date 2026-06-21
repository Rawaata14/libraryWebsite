const doQuery = require("../query");
const bcrypt = require("bcrypt");

async function registerUser(detailsToInsert) {
  const { fullName, email, phone, passwordHash, role, status } =
    detailsToInsert;

  //check data
  if (!fullName || !email || !passwordHash) {
    return { success: false, message: "Missing required fields" };
  }
  if (passwordHash.length < 6 || passwordHash.length > 20) {
    return {
      success: false,
      message: "Password must be between 6 and 20 characters long",
    };
  }

  const normalizedPhone = detailsToInsert.phone || null; // Optional field, set to null if not provided
  const normalizedRole = detailsToInsert.role || "reader"; // Default role is "reader"
  const normalizedStatus = detailsToInsert.status || "active"; // Default status is "active"
  try {
    //check if reader already exists according to email
    const existingUserSQL = "SELECT * FROM user WHERE email = ?";
    const existingUser = await doQuery(existingUserSQL, [email]);

    if (existingUser.length > 0) {
      return { success: false, message: "User with this email already exists" };
    } else {
      const hashedPassword = await bcrypt.hash(passwordHash, 10);

      let paramsToInsert = [
        fullName,
        email,
        normalizedPhone,
        hashedPassword,
        normalizedRole,
        normalizedStatus,
      ];

      const insertUserSQL =
        "INSERT INTO user (fullName, email, phone, passwordHash, role, status) VALUES (?, ?, ?, ?, ?, ?)";
      const result = await doQuery(insertUserSQL, paramsToInsert);

      if (result.affectedRows > 0) {
        return { success: true, message: "User registered successfully" };
      }
      return { success: false, message: "Could not create user account" };
    }
  } catch (error) {
    console.error("Error during registration:", error);
    return {
      success: false,
      message: "An error occurred while registering the user",
    };
  }
}

/*
---------------------------------------------------------
loginUser

תפקיד:
מבצע התחברות למערכת.

שלבי הפעולה:
1. מחפש את המשתמש לפי אימייל.
2. בודק התאמה בין הסיסמה שהוזנה לסיסמה השמורה במסד הנתונים.
3. מעדכן את זמן ההתחברות האחרון.
4. מחזיר את נתוני המשתמש המעודכנים.
---------------------------------------------------------
*/
async function loginUser(email, password) {
  try {
    console.log("Attempting to log in user with email:", email);

    const getUserSQL = "SELECT * FROM user WHERE email = ?";

    const users = await doQuery(getUserSQL, [email]);

    if (users.length === 0) {
      return {
        success: false,
        message: "User not found",
      };
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isMatch) {
      return {
        success: false,
        message: "Invalid password",
      };
    }

    /*
    ---------------------------------------------------------
    עדכון זמן התחברות אחרון

    תפקיד:
    שמירת זמן ההתחברות האחרון של המשתמש.
    ---------------------------------------------------------
    */
    const updateLastLoginSQL =
      "UPDATE user SET lastLoginAt = NOW() WHERE email = ?";

    await doQuery(updateLastLoginSQL, [email]);

    /*
    ---------------------------------------------------------
    שליפת המשתמש לאחר עדכון זמן התחברות

    תפקיד:
    מחזירה את הנתונים המעודכנים של המשתמש
    כולל lastLoginAt החדש.
    ---------------------------------------------------------
    */
    const updatedUsers = await doQuery(
      getUserSQL,
      [email]
    );

    const updatedUser = updatedUsers[0];

    return {
      success: true,
      message: "Login successful",
      user: updatedUser,
    };
  } catch (error) {
    console.error("Error during login:", error);

    return {
      success: false,
      message: "An error occurred while logging in",
    };
  }
}

/*
  updateProfileImage
  ------------------
  תפקיד:
  עדכון שם קובץ תמונת הפרופיל של המשתמש במסד הנתונים.

  למה נוצרה:
  כאשר משתמש או ספרן מעלים תמונת פרופיל חדשה,
  התמונה עצמה נשמרת בתיקיית uploads,
  ובמסד הנתונים נשמר רק שם הקובץ.

  פרמטרים:
  - email: האימייל של המשתמש המחובר.
  - profileImageName: שם קובץ התמונה שנשמר בשרת.
*/
async function updateProfileImage(email, profileImageName) {
  try {
    const updateImageSQL =
      "UPDATE `user` SET profile_image_name = ? WHERE email = ?";

    const result = await doQuery(updateImageSQL, [
      profileImageName,
      email,
    ]);

    if (result.affectedRows > 0) {
      const getUserSQL = "SELECT * FROM `user` WHERE email = ?";
      const users = await doQuery(getUserSQL, [email]);

      return {
        success: true,
        message: "Profile image updated successfully",
        user: users[0],
      };
    }

    return {
      success: false,
      message: "User not found",
    };
  } catch (error) {
    console.error("Error updating profile image:", error);

    return {
      success: false,
      message: "Failed to update profile image",
    };
  }
}

/*
---------------------------------------------------------
updateUserProfile

תפקיד:
עדכון פרטי המשתמש במסד הנתונים.

למה נוצרה:
מאפשרת למשתמש או לספרן לעדכן:
- שם מלא
- אימייל
- טלפון
- סיסמה

במידה ולא הוכנסה סיסמה חדשה,
הסיסמה הקיימת נשארת ללא שינוי.
---------------------------------------------------------
*/
async function updateUserProfile(currentEmail, updatedData) {
  try {
    const { fullName, email, phone, password } = updatedData;

    if (!fullName || !email) {
      return {
        success: false,
        message: "Full name and email are required",
      };
    }

    if (email !== currentEmail) {
      const existingUserSQL =
        "SELECT * FROM `user` WHERE email = ?";

      const existingUsers =
        await doQuery(existingUserSQL, [email]);

      if (existingUsers.length > 0) {
        return {
          success: false,
          message: "Email already exists",
        };
      }
    }

    let updateSQL =
      "UPDATE `user` SET fullName = ?, email = ?, phone = ?";

    const params = [
      fullName,
      email,
      phone || null,
    ];

    if (password && password.trim() !== "") {
      const hashedPassword =
        await bcrypt.hash(password, 10);

      updateSQL += ", passwordHash = ?";

      params.push(hashedPassword);
    }

    updateSQL += " WHERE email = ?";

    params.push(currentEmail);

    const result = await doQuery(updateSQL, params);

    if (result.affectedRows > 0) {
      const getUserSQL =
        "SELECT * FROM `user` WHERE email = ?";

      const users =
        await doQuery(getUserSQL, [email]);

      return {
        success: true,
        message: "Profile updated successfully",
        user: users[0],
      };
    }

    return {
      success: false,
      message: "User not found",
    };
  } catch (error) {
    console.error(
      "Error updating user profile:",
      error
    );

    return {
      success: false,
      message: "Failed to update profile",
    };
  }
}

/*
---------------------------------------------------------
getAllUsers

תפקיד:
שליפת כל המשתמשים עבור דף ניהול המשתמשים של הספרן.
כולל זמן התחברות אחרון.
---------------------------------------------------------
*/
async function getAllUsers() {
  try {
    const sql =
      "SELECT fullName, email, phone, role, status, createdAt, lastLoginAt, profile_image_name FROM `user` ORDER BY createdAt DESC";

    const users = await doQuery(sql);

    return {
      success: true,
      users,
    };
  } catch (error) {
    console.error("Error getting users:", error);

    return {
      success: false,
      message: "Failed to get users",
    };
  }
}

/*
---------------------------------------------------------
updateUserStatus

תפקיד:
עדכון סטטוס משתמש ל-active או blocked.
---------------------------------------------------------
*/
async function updateUserStatus(email, status) {
  try {
    if (!email || !status) {
      return {
        success: false,
        message: "Email and status are required",
      };
    }

    const sql = "UPDATE `user` SET status = ? WHERE email = ?";

    const result = await doQuery(sql, [status, email]);

    return {
      success: result.affectedRows > 0,
      message: "User status updated successfully",
    };
  } catch (error) {
    console.error("Error updating user status:", error);

    return {
      success: false,
      message: "Failed to update user status",
    };
  }
}

/*
---------------------------------------------------------
getUserDashboardStats

תפקיד:
שליפת נתוני דשבורד עבור משתמש רגיל לפי userId.
---------------------------------------------------------
*/
async function getUserDashboardStats(userId) {
  try {
    const borrowedBooks = await doQuery(
      "SELECT COUNT(*) AS count FROM `loan` WHERE userId = ? AND status = 'ACTIVE'",
      [userId]
    );

    const activeReservations = await doQuery(
      "SELECT COUNT(*) AS count FROM `seat_reservation` WHERE userId = ? AND status IN ('pending', 'active')",
      [userId]
    );

    const unreadNotifications = await doQuery(
      "SELECT COUNT(*) AS count FROM `notification` WHERE userId = ? AND isRead = 0",
      [userId]
    );

    const upcomingReservations = await doQuery(
      `SELECT reservationId, seatId, reservationDate, startTime, endTime, status
       FROM seat_reservation
       WHERE userId = ?
       AND reservationDate >= CURDATE()
       ORDER BY reservationDate ASC, startTime ASC
       LIMIT 5`,
      [userId]
    );

    return {
      success: true,
      stats: {
        borrowedBooks: borrowedBooks[0].count,
        activeReservations: activeReservations[0].count,
        unreadNotifications: unreadNotifications[0].count,
        upcomingReservations,
      },
    };
  } catch (error) {
    console.error("Error loading user dashboard stats:", error);

    return {
      success: false,
      message: "Failed to load user dashboard stats",
    };
  }
}

module.exports = {
  registerUser,
  loginUser,
  updateProfileImage,
  updateUserProfile,
  getAllUsers,
  updateUserStatus,
  getUserDashboardStats,
};
