const express = require('express')
const router = express.Router()
const knex = require('../db')
const jwt = require('jsonwebtoken');

//should this be required in to avoid having it repeated here and in users?
const authorize = function(req, res, next) {
  console.log("authorize")
  console.log(req.cookies) //[function]
  // console.log("this2 ", process.env.JWT_KEY)
  // if (req.cookie) {
  jwt.verify(req.cookies.token, process.env.JWT_KEY, function(err, payload) {
    console.log("authorize jwt.verify")
    if (err) {
      console.log("authorize error: ")
      res.status(401)
      return new Error(); //exit jwt.verify block...
    }
    console.log("does this enter on error? (only on success i think)")
    req.claim = payload;

    next(); //proceed to callback of router.get('/auth'...
  });

};

const softAuthorize = function(req, res, next) {
  console.log("authorize")
  console.log(req.cookies) //[function]
  // console.log("this2 ", process.env.JWT_KEY)
  // if (req.cookie) {
  jwt.verify(req.cookies.token, process.env.JWT_KEY, function(err, payload) {
    console.log("authorize jwt.verify")
    if (err) {
      req.claim = {};
      console.log("soft auth fail")
    } else {
      req.claim = payload;
      console.log("soft auth success: ", req.claim)
    }
    next(); //proceed to callback of router.get('/auth'...
  });

};


/*where gives rows, select gives cols from rows*/
router.patch('/:id', authorize, function(req, res, next) {
  console.log("patch box: ", req.body)
  knex('boxes')
    .where('boxes.id', req.body.id)
    .update(
      req.body
    )
    .returning('*')
    .then(function(result) {
      console.log("patch success")
      res.send(result)
    })
    //what should catch return actually be?
    .catch(function(result) {
      console.log("patch fail")
      res.send(result)
    })
})


//this authorize is called on page refresh to display boxes to user
router.get('/', softAuthorize, function(req, res, next) {
  console.log('enter get')
  knex('boxes')
    //table name to join, primary key, foreign key,
    .innerJoin('users', 'users.id', 'boxes.user_id')
    .select('boxes.id', 'users.id as user_id', 'users.username', 'boxes.width', 'boxes.height', 'boxes.depth')
    .orderBy('id')
    .then(function(boxes) {
      console.log('get success')
      boxes = boxes.map((ele) => {
        if (req.claim && req.claim.id === ele.user_id) {
          ele.self = true;
        } else {
          ele.self = false
        }
        return ele
      })
      console.log("boxes after map: ", boxes)

      return res.json(boxes)
    })
    .catch(function(err) {
      console.log("get fail")
      return err;
    })
})

//box object will come here as part of request (body)
//call back is skipped on authorize fail
//else cb invoked with next() from authorize()
router.post('/', authorize, function(req, res, next) {
  console.log("entered post box")
  // console.log(req)
  knex('boxes')
    .insert({
      width: req.body.width,
      height: req.body.height,
      depth: req.body.depth,
      user_id: req.claim.id
    })
    .then(function() {
      console.log('succes')
      res.send(true)
    })
    .catch(function() {
      console.log('fail')
      res.send(false)
    })
  //  i don't understand why to do user_id as foriegn key col,
  //  when another api call is still needed to get username from users with it
  //  and username still ends up on front end where it can be spoofed
  //user_id: req.claim.id //what if you had to make another http call to get this?

  //also, is all this syntax really nescisary?
})

router.delete('/:id', authorize, function(req, res, next) {
  knex('boxes')
    .where('id', req.params.id)
    .del()
    .then(function() {
      console.log("delete box success: ")
      res.send(true)
    })
    .catch(function() {
      console.log("delete box fail: ")
      res.send(false)
    })
})

module.exports = router
