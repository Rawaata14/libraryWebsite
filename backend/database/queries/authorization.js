const doQuery = require("../query");
const bcrypt = require("bcrypt");

async function registerUser(detailsToInsert) {
  const { fullName, email, phone, passwordHash, role, status } =
    detailsToInsert;

  //check data
  if (!fullName || !email || !passwordHash) {
    return { success: false, message: "Missing required fields" };
  }

  const normalizedPhone = detailsToInsert.phone || null; // Optional field, set to null if not provided
  const normalizedRole = detailsToInsert.role || "reader"; // Default role is "reader"
  const normalizedStatus = detailsToInsert.status || "active"; // Default status is "active"

  //check if reader already exists according to email
  const existingUserSQL = "SELECT * FROM users WHERE email = ?";
  const existingUser = await doQuery(existingUserSQL, [email]);

  if (existingUser.length > 0) {
    return { success: false, message: "User with this email already exists" };
  } else {
    hashedPassword = await bcrypt.hash(passwordHash, 10);

    let paramsToInsert = [fullName, email, phone, hashedPassword, role, status];

    const insertUserSQL =
      "INSERT INTO users (fullName, email, phone, passwordHash, role, status) VALUES (?, ?, ?, ?, ?, ?)";
    const result = await doQuery(insertUserSQL, paramsToInsert);

    if (result.affectedRows > 0) {
      return { success: true, message: "User registered successfully" };
    }
  }
}
module.exports = {
  registerUser,
};
