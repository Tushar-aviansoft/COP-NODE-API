const imagePath = require("../config/image-path");

function getUpcomingDateRange(monthsToAdd) {
  const startDate = new Date();
  const formattedStartDate = startDate.toISOString().split("T")[0];
  const endDate = new Date(startDate);

  endDate.setMonth(endDate.getMonth() + parseInt(monthsToAdd || 3));
  if (endDate.getDate() !== startDate.getDate()) {
    endDate.setDate(0);
  }
  const formattedEndDate = endDate.toISOString().split("T")[0];
  return { startDate: formattedStartDate, endDate: formattedEndDate };
}
function getNewLaunchedDateRange(monthsToAdd) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - parseInt(monthsToAdd || 3));
  const formattedStartDate = startDate.toISOString().split("T")[0];
  const endDate = new Date();
  const formattedEndDate = endDate.toISOString().split("T")[0];
  return { startDate: formattedStartDate, endDate: formattedEndDate };
}
function applyFuelModelLogic(feature_value, model_type, fuel_type) {
  let fv_value = feature_value;
  if (fv_value == null) {
    if (model_type == "0" && (fuel_type == "0" || fuel_type == "2")) {
      fv_value = "N/A";
    } else if (model_type == "1" && (fuel_type == "1" || fuel_type == "2")) {
      fv_value = "N/A";
    } else {
      fv_value = null;
    }
  } else {
    fv_value = fv_value;
  }
  return fv_value;
}
const wishListModelSubQuery = (auth) => {
  return auth
    ? `(SELECT 
    EXISTS (
      SELECT 1 
      FROM cop_wl 
      WHERE cop_wl.model_id = cop_models.model_id 
        AND customer_id = '${auth}'
    ) AS wl_id LIMIT 1)`
    : "0";
};
const wishListVariantSubQuery = (auth) => {
  return auth
    ? `(SELECT 
    EXISTS (
      SELECT 1 
      FROM cop_wl 
      WHERE cop_wl.variant_id = cop_variants.variant_id 
        AND customer_id = '${auth}'
    ) AS wl_id LIMIT 1)`
    : "0";
};

// Helper function to process graphic files
function processGraphicFiles(item) {
  const graphicFiles = item.graphic_file.includes(",")
    ? item.graphic_file.split(",")
    : [item.graphic_file];

  item.graphic_file = graphicFiles.map((file) =>
    imagePath.carGraphics(
      item.model_id,
      item.gt_name.toLowerCase().replace(/ /g, "_"),
      file
    )
  );
  
  const graphicFilesThumb = item.graphic_file_thumb.includes(",")
    ? item.graphic_file_thumb.split(",")
    : [item.graphic_file_thumb];

  item.graphic_file_thumb = graphicFilesThumb.map((file) =>
    imagePath.carGraphicsThumb(
      item.model_id,
      item.gt_name.toLowerCase().replace(/ /g, "_"),
      file
    )
  );
  
  const graphicFilesMob = item.graphic_file_mob.includes(",")
    ? item.graphic_file_mob.split(",")
    : [item.graphic_file_mob];

  item.graphic_file_mob = graphicFilesMob.map((file) =>
    imagePath.carGraphicsMobile(
      item.model_id,
      item.gt_name.toLowerCase().replace(/ /g, "_"),
      file
    )
  );
}


function getFeatureValue(feature) {
  return feature ? feature.trim().toLowerCase() : '';
}
module.exports = {
  getUpcomingDateRange,
  getNewLaunchedDateRange,
  applyFuelModelLogic,
  wishListModelSubQuery,
  wishListVariantSubQuery,
  processGraphicFiles,
  getFeatureValue
};
