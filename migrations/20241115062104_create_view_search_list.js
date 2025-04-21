exports.up = function (knex) {
  return knex.raw(`
    CREATE VIEW search_list AS
    SELECT
      cop_brands_ms.uuid AS id,
      cop_brands_ms.brand_name AS name,
      CONCAT(cop_brands_ms.slug, '-cars') AS slug,
      'brand' AS type
    FROM
      cop_brands_ms
      JOIN cop_models ON cop_models.brand_id = cop_brands_ms.brand_id
      JOIN cop_variants ON cop_variants.model_id = cop_models.model_id
      JOIN cop_cs_ms ON cop_cs_ms.cs_id = cop_models.cs_id
    WHERE
      cop_brands_ms.status = 1
      AND cop_models.status = 1
      AND cop_variants.status = 1
      AND cop_cs_ms.cs_name = 'Launched'
    GROUP BY
      cop_brands_ms.brand_id

    UNION

    SELECT
      cop_models.uuid AS id,
      CONCAT(cop_brands_ms.brand_name, ' ', cop_models.model_name) AS name,
      CONCAT(cop_brands_ms.slug, '-cars/', cop_models.slug) AS slug,
      'model' AS type
    FROM
      cop_models
      JOIN cop_brands_ms ON cop_models.brand_id = cop_brands_ms.brand_id
      JOIN cop_variants ON cop_variants.model_id = cop_models.model_id
      JOIN cop_cs_ms ON cop_cs_ms.cs_id = cop_models.cs_id
    WHERE
      cop_brands_ms.status = 1
      AND cop_models.status = 1
      AND cop_variants.status = 1
      AND cop_cs_ms.cs_name = 'Launched'
    GROUP BY
      cop_models.model_id

    UNION

    SELECT
      cop_variants.uuid AS id,
      CONCAT(cop_brands_ms.brand_name, ' ', cop_models.model_name, ' ', cop_variants.variant_name) AS name,
      CONCAT(cop_brands_ms.slug, '-cars/', cop_models.slug) AS slug,
      'variant' AS type
    FROM
      cop_variants
      JOIN cop_models ON cop_variants.model_id = cop_models.model_id
      JOIN cop_brands_ms ON cop_models.brand_id = cop_brands_ms.brand_id
      JOIN cop_cs_ms ON cop_cs_ms.cs_id = cop_models.cs_id
    WHERE
      cop_brands_ms.status = 1
      AND cop_models.status = 1
      AND cop_variants.status = 1
      AND cop_cs_ms.cs_name = 'Launched'
    GROUP BY
      cop_variants.variant_id
    ORDER BY name;
  `);
};

exports.down = function (knex) {
  return knex.raw("DROP VIEW IF EXISTS search_list");
};
