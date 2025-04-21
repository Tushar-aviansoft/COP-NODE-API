exports.up = function (knex) {
  return knex.raw(`
    CREATE VIEW cars_by_budget AS
    WITH RankedCars AS (
        SELECT 
            base_variant_id.model_id AS model_id,
            base_variant_id.variant_id AS variant_id,
            CONCAT(cop_brands_ms.brand_name, ' ', cop_models.model_name) AS name,
            (CASE
                WHEN (base_variant_id.price BETWEEN 200000 AND 1000000) THEN '200000-1000000'
                WHEN (base_variant_id.price BETWEEN 1000000 AND 2500000) THEN '1000000-2500000'
                WHEN (base_variant_id.price BETWEEN 2500000 AND 5000000) THEN '2500000-5000000'
                WHEN (base_variant_id.price BETWEEN 5000000 AND 10000000) THEN '5000000-10000000'
                WHEN (base_variant_id.price > 10000000) THEN '10000000+'
            END) AS price_range,
            ROW_NUMBER() OVER (
                PARTITION BY 
                (CASE
                    WHEN (base_variant_id.price BETWEEN 200000 AND 1000000) THEN '200000-1000000'
                    WHEN (base_variant_id.price BETWEEN 1000000 AND 2500000) THEN '1000000-2500000'
                    WHEN (base_variant_id.price BETWEEN 2500000 AND 5000000) THEN '2500000-5000000'
                    WHEN (base_variant_id.price BETWEEN 5000000 AND 10000000) THEN '5000000-10000000'
                    WHEN (base_variant_id.price > 10000000) THEN '10000000+'
                END)
                ORDER BY base_variant_id.model_id, base_variant_id.variant_id
            ) AS row_num
        FROM
            base_variant_id
            JOIN cop_models ON cop_models.model_id = base_variant_id.model_id
            JOIN cop_brands_ms ON cop_brands_ms.brand_id = base_variant_id.brand_id
        WHERE
            cop_models.model_type = '0'
            AND base_variant_id.price BETWEEN 200000 AND 200000000
    )
    SELECT 
        model_id, 
        variant_id, 
        name, 
        price_range
    FROM 
        RankedCars
    WHERE 
        row_num <= 10
    ORDER BY 
        FIELD(price_range, '200000-1000000', '1000000-2500000', '2500000-5000000', '5000000-10000000', '10000000+');
  `);
};

exports.down = function (knex) {
  return knex.raw(`DROP VIEW IF EXISTS cars_by_budget`);
};
