/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    // Create the `cop_model_desc` table
    return knex.schema.createTable('cop_model_desc', function(table) {
      table.increments('id').primary();
      table.bigInteger('brand_id').unsigned();
      table.bigInteger('model_id').unsigned();
      table.text('description').nullable();
      table.text('thing_like').nullable();
      table.text('thing_improve').nullable();
      table.boolean('status').defaultTo(true);
      table.bigInteger('created_by').unsigned();
      table.bigInteger('updated_by').unsigned().nullable();
      table.timestamps(true, true);
  
      // Foreign key constraints
      table.foreign('brand_id').references('brand_id').inTable('cop_brands_ms').onDelete('cascade').onUpdate('cascade');
      table.foreign('model_id').references('model_id').inTable('cop_models').onDelete('cascade').onUpdate('cascade');
      table.foreign('created_by').references('id').inTable('users').onDelete('cascade').onUpdate('cascade');
      table.foreign('updated_by').references('id').inTable('users').onDelete('cascade').onUpdate('cascade');
    })
    .then(() => {
      // Add permissions (this assumes you have a 'permissions' table already)
      const permissions = [
        'model_descriptions_import',
        'model_descriptions_export',
        'create_model_descriptions',
        'view_model_descriptions',
        'edit_model_descriptions',
        'delete_model_descriptions'
      ];
  
      return knex('permissions').insert(permissions.map(permission => ({
        name: permission,
        guard_name: 'web',
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      }))).onConflict('name').ignore(); // Use `ignore` to avoid duplication
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
    // Drop the `cop_model_desc` table
    return knex.schema.dropTableIfExists('cop_model_desc')
      .then(() => {
        // Remove the permissions
        return knex('permissions').whereIn('name', [
          'model_descriptions_import',
          'model_descriptions_export',
          'create_model_descriptions',
          'view_model_descriptions',
          'edit_model_descriptions',
          'delete_model_descriptions'
        ]).del();
      });
  };
  