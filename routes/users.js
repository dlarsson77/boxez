const express = require('express')
const jwt = require('jsonwebtoken');
const router = express.Router()
const knex = require('../db')
const bcrypt = require('bcrypt-as-promised');
// const { camelizeKeys } = require('humps');

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
    req.claim = payload; //what is this for?

    next(); //proceed to callback of router.get('/auth'...
  });
};

//sign in user
router.post('/signin', function(req, res, next) { //where do req, res, next come from
  console.log("status: ", req.status)

  knex('users')
    .where('username', req.body.username)
    .then(function(user) {
      //if username existed in db
      if (user.length !== 0) {
        // let user = camelizeKeys(row);
        console.log(user[0].hashed_password)
        bcrypt.compare(req.body.password, user[0].hashed_password)
          .then(function() {
            // verified username to hashed password so:
            console.log("ok username", user)

            // issue this user a JWT
            const claim = {
              id: user[0].id,
              username: user[0].username
            };
            const token = jwt.sign(claim, process.env.JWT_KEY, { //???
              expiresIn: '7 days'
            });

            // add a cookie to the response -what does this do?
            res.cookie('token', token, {
              httpOnly: true,
              expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days
              // secure: router.get('env') === 'production' //?
            });

            // remove hashed password before we send back the response.
            delete user[0].hashed_password;

            //return username to authservice to populate username field
            //  verify this is ok security practice (is there relatively good way to keep username on backend only?)
            res.send(user[0].username); //auto sets to 200
          })
          .catch(function() {
            console.log("bad password")
            // bad password
            res.status(401);
            next(res)
          });
      } else {
        console.log("username does not exist")
        //bad username
        res.status(401);
        throw new Error()
      }
    })
    .catch(function(result) {
      next(result) //this will look for server middleware with four params (req, res, err, next)
    })
})

//sign up user
router.post('/signup', function(req, res, next) {
  console.log("status: ", req.status)

  knex('users')
    .where('username', req.body.username)
    .then(function(user) {
      //if username does not exist in db
      if (user.length === 0) {
        //generate password hash for this user
        bcrypt.hash(req.body.password, 12)
          .then(function(retHashed_password) {
            knex('users')
              .insert({
                username: req.body.username,
                hashed_password: retHashed_password,
              })
              .then(function() {
                res.send(true)
              })
          })
          .catch(function(err) {
            next(err);
          })
      } else {
        console.log("username already exists")
        //bad username
        res.status(401);
        throw new Error()
      }
    })
    .catch(function(err) {
      next(err)
    })
});

//check if user has a valid jwt
// router.get('/auth', authorize, (req, res, next) => {
//   console.log("entered /auth")
//   //return to front end /auth call promise, to enter then or catch based on res status
//   res.send(result)
// });

// router.get('/auth', (req, res, next) => {
//   console.log("auth")
//   jwt.verify(req.cookies.token, process.env.JWT_KEY, (err, payload) => {
//     if (err) {
//       console.log("auth ok")
//       // return res.send({
//       //   result: false
//       // });
//     }
//     console.log("auth fail")
//     // return res.send({
//     //   result: true,
//     //   userId: payload.userId
//     // });
//   });
// });

router.get('/auth', (req, res) => {
  jwt.verify(req.cookies.token, process.env.JWT_KEY, (err, _payload) => {
    console.log("entered jwt.verify")
    if (err) {
      console.log("jwt.verify err")
      res.statusCode=401
      res.send(err);
    } else {
      console.log("jwt.verify true")
      console.log("/auth response: ", _payload)

      //send username back to authService to populate userame field
      res.send(_payload.username);
    }
  });
});

//clear cookie (sign out user)
//no promises on these??
router.delete('/auth', (req, res) => {
  res.clearCookie('token');
  res.end()
  console.log("ok")
  // res.send(response)
});

module.exports = router

/*

*/
