module.exports = {

  development: {
    client: 'pg',
    connection: {
      database: process.env.DATABASE_URL || 'colorbox_dev',
    }
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL
  }
};

/*
...not really sure what needs to be done to setup knex...
what about this from https://learn.galvanize.com/cohorts/180/units/2802/content_files/33131
----
'use strict';

module.exports = {
  development: {
    client: 'pg',
    connection: 'postgres://localhost/movie_junkies_dev'
  }
};
----
and same page, this in index.js:

'use strict';

const env = 'development';
const config = require('./knexfile')[env];
const knex = require('knex')(config);

const sql = knex('movies').toString();

console.log(sql);

knex.destroy();
*/
