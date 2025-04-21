exports.up = function (knex) {
  return knex.raw(`
    CREATE VIEW base_variant_id AS
    WITH RankedVariants AS (
      SELECT 
        cp.brand_id AS brand_id,
        cp.model_id AS model_id,
        cp.variant_id AS variant_id,
        cp.ex_showroom_price AS price,
        ROW_NUMBER() OVER (PARTITION BY cp.model_id ORDER BY cp.ex_showroom_price) AS row_num
      FROM 
        cop_pe_ms cp
        JOIN cop_variants ON (cop_variants.variant_id = cp.variant_id)
        JOIN cop_models ON (cop_models.model_id = cop_variants.model_id)
        JOIN cop_brands_ms ON (cop_brands_ms.brand_id = cop_models.brand_id)
      WHERE 
        cop_variants.status = 1 
        AND cop_models.status = 1 
        AND cop_brands_ms.status = 1
    )
    SELECT 
      RankedVariants.brand_id AS brand_id,
      RankedVariants.model_id AS model_id,
      RankedVariants.variant_id AS variant_id,
      RankedVariants.price AS price
    FROM 
      RankedVariants
    WHERE 
      RankedVariants.row_num = 1
    ORDER BY 
      RankedVariants.brand_id;
  `);
};

exports.down = function (knex) {
  return knex.raw("DROP VIEW IF EXISTS base_variant_id");
};
