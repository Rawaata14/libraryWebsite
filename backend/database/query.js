const { getConnection } = require("./dbSingleton");

async function doQuery(sql, params = []) {
  try {
    const db = await getConnection();
    const [result] = await db.query(sql, params);
    console.log("Query executed successfully. Result:", result);
    return result;
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
}

module.exports = doQuery;
