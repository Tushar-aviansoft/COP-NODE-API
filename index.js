// index.js
const app = require("./app");
require("dotenv").config();

const PORT = process.argv[2] || process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
