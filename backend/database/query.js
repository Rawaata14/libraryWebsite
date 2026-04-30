const getConnection = require("./dbSingleton");

async function doQuery(sql, params = []) {
  const db = await getConnection();
  const result = await db.query(sql, params);

  console.log(result[0], "result from doQuery");
  return result[0];
}

module.exports = doQuery;
