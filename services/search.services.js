const db = require("../config/database");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");

const search = async (search) => {
  const query = () => {
    return db("search_list")
      .select("id", "name", "slug")
      .where("name", "like", `${search}%`)
      .orWhere("name", "like", `%${search}%`)
      .orWhereRaw("SOUNDEX(name) = SOUNDEX(?)", [search])
      .orderBy("type")
      .orderByRaw("name LIKE ? DESC, name LIKE ? DESC", [
        `${search}%`,
        `%${search}%`,
      ]);
  };

  try {
    let result = await query();
    if (result.length == 0) {
      result = await db("search_list")
        .select("id", "name", "slug")
        .where("name", "like", `${search.charAt(0)}%`)
        .orWhere("name", "like", `%${search.charAt(0)}%`)
        .orWhereRaw("SOUNDEX(name) = SOUNDEX(?)", [search])
        .orderByRaw("name LIKE ? DESC, name LIKE ? DESC", [
          `${search.charAt(0)}%`,
          `%${search.charAt(0)}%`,
        ])
        .limit(20);
    }

    return result;
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};
module.exports = { search };
