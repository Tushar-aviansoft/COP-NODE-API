// database.js
const knex = require("knex");
require("dotenv").config();

const db = knex({
  client: "mysql2",
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
});
if (process.env.QUERY == "YES") {
  db.on("query", (queryData) => {
    // console.log("Query:", queryData.sql);
    // console.log("Bindings:", queryData.bindings);
  });
}

module.exports = db;
