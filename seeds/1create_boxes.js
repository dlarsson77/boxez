const boxesList = [
  {
    width: 25,
    height: 25,
    depth: 25,
    user_id: 1
  },
  {
    width: 25,
    height: 25,
    depth: 25,
    user_id: 1
  },
  {
    width: 25,
    height: 25,
    depth: 25,
    user_id: 3
  },

  {width: 25, height: 25, depth: 25, user_id: 2},
  {width: 25, height: 25, depth: 25, user_id: 1},
  {width: 25, height: 25, depth: 25, user_id: 3},



  {width: 25, height: 25, depth: 25, user_id: 1},
  {width: 25, height: 25, depth: 25, user_id: 2},
  {width: 25, height: 25, depth: 25, user_id: 1},

  {width: 25, height: 25, depth: 25, user_id: 3},
  {width: 25, height: 25, depth: 25, user_id: 1}
  // {width: 25, height: 25, depth: 25, user_id: 2},
  //
  // {width: 25, height: 25, depth: 25, user_id: 3},
  // {width: 25, height: 25, depth: 25, user_id: 3},
  // {width: 25, height: 25, depth: 25, user_id: 3},
  //
  // {width: 25, height: 25, depth: 25, user_id: 2},
  // {width: 25, height: 25, depth: 25, user_id: 1},
  // {width: 25, height: 25, depth: 25, user_id: 2},
  //
  // {width: 25, height: 25, depth: 25, user_id: 1},
  // {width: 25, height: 25, depth: 25, user_id: 1},
  // {width: 25, height: 25, depth: 25, user_id: 3}

]

exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('boxes').del()
    .then(function () {
      // Inserts seed entries
      return knex('boxes').insert(
        boxesList
      );
    })
    .then(() => {
      //?
    return knex.raw("SELECT setval('boxes_id_seq', (SELECT MAX(id) FROM boxes));")
    });
};
