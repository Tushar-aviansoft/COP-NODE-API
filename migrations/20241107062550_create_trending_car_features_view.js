exports.up = function (knex) {
  return knex.raw(`
    CREATE VIEW trending_car_features AS
    SELECT 
      u936514376_COPV2.cop_fv.model_id AS model_id,
      GROUP_CONCAT(
        DISTINCT JSON_OBJECT(
          'feature_value',
          CASE 
            WHEN u936514376_COPV2.cop_fv.feature_value REGEXP '(\\d+(\\.\\d+)?)\\s*bhp' THEN CONCAT(
              CAST(
                SUBSTRING_INDEX(
                  REGEXP_SUBSTR(u936514376_COPV2.cop_fv.feature_value, '(\\d+(\\.\\d+)?)\\s*bhp'),
                  ' ',
                  1
                ) AS DECIMAL(10, 2)
              ),
              ' ',
              u936514376_COPV2.cop_su_ms.su_name
            ) 
            ELSE CONCAT(
              u936514376_COPV2.cop_fv.feature_value,
              ' ',
              u936514376_COPV2.cop_su_ms.su_name
            )
          END,
          'features_image',
          CONCAT(
            u936514376_COPV2.cop_fv.feature_id,
            '/',
            u936514376_COPV2.cop_features_ms.features_image
          )
        )
        ORDER BY 
          CASE 
            WHEN u936514376_COPV2.cop_features_ms.features_name = 'Displacement' THEN 1 
            WHEN u936514376_COPV2.cop_features_ms.features_name = 'Power' THEN 2 
            WHEN u936514376_COPV2.cop_features_ms.features_name = 'Range' THEN 3 
            WHEN u936514376_COPV2.cop_features_ms.features_name = 'Power (EV)' THEN 4 
            ELSE 5 
          END ASC 
        SEPARATOR '##'
      ) AS feature_json
    FROM
      u936514376_COPV2.cop_fv
      JOIN u936514376_COPV2.cop_features_ms ON u936514376_COPV2.cop_features_ms.feature_id = u936514376_COPV2.cop_fv.feature_id
      JOIN u936514376_COPV2.cop_su_ms ON u936514376_COPV2.cop_su_ms.su_id = u936514376_COPV2.cop_features_ms.su_id
      JOIN u936514376_COPV2.cop_cl_data ON u936514376_COPV2.cop_cl_data.model_id = u936514376_COPV2.cop_fv.model_id
      JOIN u936514376_COPV2.cop_cl_ms ON u936514376_COPV2.cop_cl_data.cl_id = u936514376_COPV2.cop_cl_ms.cl_id
      JOIN u936514376_COPV2.base_variant_id mv ON mv.model_id = u936514376_COPV2.cop_fv.model_id 
      AND mv.variant_id = u936514376_COPV2.cop_fv.variant_id
    WHERE
      u936514376_COPV2.cop_features_ms.features_name IN ('Displacement', 'Range', 'Power (EV)', 'Power')
      AND u936514376_COPV2.cop_cl_ms.cl_name IN ('Popular Cars', 'EV Cars')
    GROUP BY 
      u936514376_COPV2.cop_fv.model_id, mv.variant_id
  `);
};

exports.down = function (knex) {
  return knex.raw("DROP VIEW IF EXISTS trending_car_features");
};
