const usersList = [
  {
    id: 1,
    username: 'snarf',
    hashed_password: '$2a$12$oEnJjrb2XsPOTGhrn0o21.Ck5qiOXF4OIXes1rjCrbQJlRlSwoTVW',// failbetter
    created_at: new Date('2017-08-01 14:26:16 UTC'),
    updated_at: new Date('2017-08-01 14:26:16 UTC')
  },
  {
    id: 2,
    username: 'blarf',
    hashed_password: '$2a$12$oEnJjrb2XsPOTGhrn0o21.Ck5qiOXF4OIXes1rjCrbQJlRlSwoTVW',// failbetter
    created_at: new Date('2017-08-02 14:26:16 UTC'),
    updated_at: new Date('2017-08-02 14:26:16 UTC')
  },
  {
    id: 3,
    username: 'marf',
    hashed_password: '$2a$12$oEnJjrb2XsPOTGhrn0o21.Ck5qiOXF4OIXes1rjCrbQJlRlSwoTVW',// failbetter
    created_at: new Date('2017-08-02 14:26:16 UTC'),
    updated_at: new Date('2017-08-02 14:26:16 UTC')
  }
]

exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('users').del()
    .then(function () {
      // Inserts seed entries
      return knex('users').insert(
        usersList
      );
    })
    .then(() => {
      //?
    return knex.raw("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));")
    });
};
