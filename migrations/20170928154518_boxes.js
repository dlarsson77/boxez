
exports.up = function(knex, Promise) {
  return knex.schema.createTable('boxes', (table) => {
    table.increments();
    table.float('width').notNullable();
    table.float('height').notNullable();
    table.float('depth').notNullable();
    table.integer('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .index();
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('boxes')
};
