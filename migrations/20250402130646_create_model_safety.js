/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    // Create the `cop_model_safety` table
    return knex.schema.createTable('cop_model_safety', function(table) {
      table.increments('id').primary();
      table.bigInteger('brand_id').unsigned();
      table.bigInteger('model_id').unsigned();
      table.text('heading').nullable();
      table.text('description').nullable();
      table.string('image').nullable();
      table.boolean('status').defaultTo(true);
      table.bigInteger('created_by').unsigned();
      table.bigInteger('updated_by').unsigned().nullable();
      table.timestamps(true, true);
  
      // Foreign key constraints
      table.foreign('brand_id').references('brand_id').inTable('cop_brands_ms').onDelete('cascade').onUpdate('cascade');
      table.foreign('model_id').references('model_id').inTable('cop_models').onDelete('cascade').onUpdate('cascade');
      table.foreign('created_by').references('id').inTable('users').onDelete('cascade').onUpdate('cascade');
      table.foreign('updated_by').references('id').inTable('users').onDelete('cascade').onUpdate('cascade');
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
    // Drop the `cop_model_safety` table
    return knex.schema.dropTableIfExists('cop_model_safety');
  };
  