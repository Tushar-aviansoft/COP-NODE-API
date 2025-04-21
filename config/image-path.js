const imagePath = {
  banner: `${process.env.IMAGE_PATH}public/Banner/`,
  brand: `${process.env.IMAGE_PATH}public/brands/`,
  carTypes: `${process.env.IMAGE_PATH}public/car_types/`,
  specification: `${process.env.IMAGE_PATH}public/Specification/`,
  feature: `${process.env.IMAGE_PATH}public/Feature/`,
  carGraphics: (model_id, gt_type, image_name) =>
    `${process.env.IMAGE_PATH}public/car_graphics/${model_id}/${gt_type}/${image_name}`,
  carGraphicsThumb: (model_id, gt_type, image_name) =>
    `${process.env.IMAGE_PATH}public/car_graphics/${model_id}/${gt_type}/thumb/${image_name}`,
  carGraphicsMobile: (model_id, gt_type, image_name) =>
    `${process.env.IMAGE_PATH}public/car_graphics/${model_id}/${gt_type}/mobile/${image_name}`,
  warningLightIcons:`${process.env.IMAGE_PATH}public/warning_light/`
};

module.exports = imagePath;

