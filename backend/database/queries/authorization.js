const doQuery = require("../query");
const bcrypt = require("bcrypt");


/*
---------------------------------------------------------
createSafeUser

תפקיד:
יוצרת אובייקט משתמש בטוח לשליחה ל-Frontend
ולשמירה בתוך ה-Session.

למה נוצרה:
הרשומה שמגיעה ממסד הנתונים מכילה passwordHash.
אסור לשלוח את הסיסמה המוצפנת לדפדפן או לשמור אותה
בתוך ה-Session, גם אם היא אינה הסיסמה המקורית.
---------------------------------------------------------
*/
function createSafeUser(user) {
  return {
    userId: user.userId,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    profile_image_name: user.profile_image_name,
  };
}


/*
---------------------------------------------------------
registerUser

תפקיד:
יוצרת חשבון קורא חדש במערכת.

שלבי הפעולה:
1. מנקה ומאמתת את הנתונים שהתקבלו.
2. בודקת שלא קיים משתמש עם אותו אימייל.
3. מצפינה את הסיסמה.
4. יוצרת משתמש חדש עם role של reader.
5. מחזירה אובייקט משתמש בטוח ללא passwordHash.
---------------------------------------------------------
*/
async function registerUser(detailsToInsert) {
  const fullName = detailsToInsert.fullName?.trim();
  const email = detailsToInsert.email?.trim().toLowerCase();
  const phone = detailsToInsert.phone?.trim() || null;
  const address = detailsToInsert.address?.trim() || null;
  const password = detailsToInsert.password;

  if (!fullName || !email || !password) {
    return {
      success: false,
      message: "Full name, email and password are required",
    };
  }

  if (password.length < 6 || password.length > 20) {
    return {
      success: false,
      message: "Password must be between 6 and 20 characters long",
    };
  }

  try {
    const existingUsers = await doQuery(
      "SELECT userId FROM `user` WHERE email = ?",
      [email],
    );

    if (existingUsers.length > 0) {
      return {
        success: false,
        message: "User with this email already exists",
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertResult = await doQuery(
      `INSERT INTO \`user\`
        (fullName, email, phone, address, passwordHash, role, status)
       VALUES (?, ?, ?, ?, ?, 'reader', 'active')`,
      [fullName, email, phone, address, hashedPassword],
    );

    const createdUsers = await doQuery(
      "SELECT * FROM `user` WHERE userId = ?",
      [insertResult.insertId],
    );

    return {
      success: true,
      message: "User registered successfully",
      user: createSafeUser(createdUsers[0]),
    };
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
מבצעת התחברות מאובטחת למערכת.

שלבי הפעולה:
1. מנקה ומאמתת את האימייל והסיסמה.
2. מחפשת את המשתמש לפי אימייל.
3. בודקת שהמשתמש אינו חסום.
4. משווה את הסיסמה לסיסמה המוצפנת.
5. מעדכנת את זמן ההתחברות האחרון.
6. מחזירה משתמש בטוח ללא passwordHash.
---------------------------------------------------------
*/
async function loginUser(email, password) {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return {
      success: false,
      message: "Email and password are required",
    };
  }

  try {
    const users = await doQuery(
      "SELECT * FROM `user` WHERE email = ?",
      [normalizedEmail],
    );

    if (users.length === 0) {
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    const user = users[0];

    if (user.status !== "active") {
      return {
        success: false,
        message: "This account is blocked",
      };
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    if (!isPasswordCorrect) {
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    await doQuery(
      "UPDATE `user` SET lastLoginAt = NOW() WHERE userId = ?",
      [user.userId],
    );

    const updatedUsers = await doQuery(
      "SELECT * FROM `user` WHERE userId = ?",
      [user.userId],
    );

    return {
      success: true,
      message: "Login successful",
      user: createSafeUser(updatedUsers[0]),
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
---------------------------------------------------------
updateProfileImage

תפקיד:
מעדכנת במסד הנתונים את שם קובץ תמונת הפרופיל
ומחזירה אובייקט משתמש בטוח.

פרמטרים:
- email: האימייל של המשתמש המחובר.
- profileImageName: שם הקובץ שנשמר בשרת.
---------------------------------------------------------
*/
async function updateProfileImage(email, profileImageName) {
  if (!email || !profileImageName) {
    return {
      success: false,
      message: "User email and profile image are required",
    };
  }

  try {
    await doQuery(
      `UPDATE \`user\`
       SET profile_image_name = ?
       WHERE email = ?`,
      [profileImageName, email],
    );

    const users = await doQuery(
      "SELECT * FROM `user` WHERE email = ?",
      [email],
    );

    if (users.length === 0) {
      return {
        success: false,
        message: "User not found",
      };
    }

    return {
      success: true,
      message: "Profile image updated successfully",
      user: createSafeUser(users[0]),
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
מעדכנת את הפרטים האישיים של המשתמש המחובר.

ניתן לעדכן:
- שם מלא
- אימייל
- טלפון
- כתובת
- סיסמה

אם לא הוזנה סיסמה חדשה:
הסיסמה הקיימת נשארת ללא שינוי.

לאחר העדכון:
מוחזר אובייקט משתמש בטוח ללא passwordHash.
---------------------------------------------------------
*/
async function updateUserProfile(currentEmail, updatedData) {
  const fullName = updatedData.fullName?.trim();
  const email = updatedData.email?.trim().toLowerCase();
  const phone = updatedData.phone?.trim() || null;
  const address = updatedData.address?.trim() || null;
  const password = updatedData.password?.trim() || "";

  if (!fullName || !email) {
    return {
      success: false,
      message: "Full name and email are required",
    };
  }

  if (password && (password.length < 6 || password.length > 20)) {
    return {
      success: false,
      message: "Password must be between 6 and 20 characters long",
    };
  }

  try {
    if (email !== currentEmail) {
      const existingUsers = await doQuery(
        "SELECT userId FROM `user` WHERE email = ?",
        [email],
      );

      if (existingUsers.length > 0) {
        return {
          success: false,
          message: "Email already exists",
        };
      }
    }

    let updateSQL = `
      UPDATE \`user\`
      SET fullName = ?,
          email = ?,
          phone = ?,
          address = ?
    `;

    const params = [fullName, email, phone, address];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);

      updateSQL += ", passwordHash = ?";
      params.push(hashedPassword);
    }

    updateSQL += " WHERE email = ?";
    params.push(currentEmail);

    await doQuery(updateSQL, params);

    const updatedUsers = await doQuery(
      "SELECT * FROM `user` WHERE email = ?",
      [email],
    );

    if (updatedUsers.length === 0) {
      return {
        success: false,
        message: "User not found",
      };
    }

    return {
      success: true,
      message: "Profile updated successfully",
      user: createSafeUser(updatedUsers[0]),
    };
  } catch (error) {
    console.error("Error updating user profile:", error);

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
מעדכנת את סטטוס המשתמש ל-active או blocked.

הגנות:
- נדרשים אימייל וסטטוס.
- מתקבלים רק סטטוסים חוקיים.
- הספרן המחובר אינו יכול לחסום את החשבון של עצמו.
- נבדק שהמשתמש קיים לפני ביצוע העדכון.
---------------------------------------------------------
*/
async function updateUserStatus(
  email,
  status,
  currentLibrarianEmail,
) {
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedStatus = status?.trim().toLowerCase();
  const normalizedLibrarianEmail = currentLibrarianEmail
    ?.trim()
    .toLowerCase();

  const allowedStatuses = ["active", "blocked"];

  if (!normalizedEmail || !normalizedStatus) {
    return {
      success: false,
      message: "Email and status are required",
    };
  }

  if (!allowedStatuses.includes(normalizedStatus)) {
    return {
      success: false,
      message: "Status must be active or blocked",
    };
  }

  if (
    normalizedEmail === normalizedLibrarianEmail &&
    normalizedStatus === "blocked"
  ) {
    return {
      success: false,
      message: "You cannot block your own account",
    };
  }

  try {
    const users = await doQuery(
      `SELECT userId
       FROM \`user\`
       WHERE email = ?`,
      [normalizedEmail],
    );

    if (users.length === 0) {
      return {
        success: false,
        message: "User not found",
      };
    }

    await doQuery(
      `UPDATE \`user\`
       SET status = ?
       WHERE email = ?`,
      [normalizedStatus, normalizedEmail],
    );

    return {
      success: true,
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
