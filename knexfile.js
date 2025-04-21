// knexfile.js
require("dotenv").config();
const dbConfig = require("./config/database");

module.exports = {
  development: {
    ...dbConfig.client.config,
    migrations: {
      directory: "./migrations", // Ensure this directory exists
    },
    seeds: {
      directory: "./seeds", // Optional, if you have seed files
    },
  },
};
