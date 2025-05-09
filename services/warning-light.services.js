const db = require("../config/database");
const imagePath = require("../config/image-path");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");

const warningLights = async () => {
  const query = () => {
    return db("cop_cwl_ms").select(
      db.raw("uuid as id"),
      db.raw("wl_name as name"),

      db.raw(`CONCAT(?, wl_id, '/', wl_icon) as icon`, [
        imagePath.warningLightIcons,
      ]),
      db.raw("wl_heading as heading"),
      db.raw("wl_subheading as sub_heading"),
      db.raw("wl_info as info"),
      db.raw("wl_display_position as position")
    );
  };
  try {
    const result = await query();
    const a = result.map((row) => ({
      ...row,
      sub_heading: row.sub_heading ? JSON.parse(row.sub_heading) : [],
      info: row.info ? JSON.parse(row.info) : [],
    }));
    return a || [];
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
  }
};
module.exports = { warningLights };
