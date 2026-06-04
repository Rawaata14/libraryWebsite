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

async function loginUser(email, password) {
  try {
    console.log("Attempting to log in user with email:", email);
    const getUserSQL = "SELECT * FROM user WHERE email = ?";
    const users = await doQuery(getUserSQL, [email]);
    if (users.length === 0) {
      return { success: false, message: "User not found" };
    }
    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return { success: false, message: "Invalid password" };
    }

    return { success: true, message: "Login successful", user };
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

module.exports = {
  registerUser,
  loginUser,
  updateProfileImage,
  updateUserProfile,
};
