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
  pool: {
    min: 5,
    max: 20,
    acquireTimeoutMillis: 5000, // Timeout for acquiring a connection
    createTimeoutMillis: 3000, // Timeout for creating a new connection
    validate: (conn) => conn.query("SELECT 1"), // Validate connections
  },
});

// Event listener for debugging queries
if (process.env.QUERY === "YES") {
  db.on("query", (queryData) => {
    console.log("Executing Query:", queryData.sql);
    console.log("Bindings:", queryData.bindings);
  });
}

// Gracefully close the database connection
process.on("SIGINT", async () => {
  console.log("Closing database connection...");
  await db.destroy();
  process.exit(0);
});

module.exports = db;


// // database.js
// const knex = require("knex");
// require("dotenv").config();

// const db = knex({
//   client: "mysql2",
//   connection: {
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//   },
//   pool: {
//     min: 2,
//     max: 5
//   },
// });
// if (process.env.QUERY == "YES") {
//   db.on("query", (queryData) => {
//     // console.log("Query:", queryData.sql);
//     // console.log("Bindings:", queryData.bindings);
//   });
// }

// module.exports = db;
