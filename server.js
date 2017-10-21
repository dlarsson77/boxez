//the things we "require" are coming from node modules folder (the string is the name of the module from the node modules folder, the code of which is returned by "require")
const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
//module that looks for dot env file, maps to process.env
if (process.env.NODE_ENV !== 'production') {
  //config looks for .env, extracts key val pairs, adds them to process.env
  require('dotenv').config();
}
const app = express()

app.use(cookieParser());

app.use(bodyParser.json())

//"__dirname" is given to us by node

//this is where public app components (html/js) live
app.use(express.static(path.join(__dirname, 'public')))

//this is where the express/node stuff lives
app.use(express.static(path.join(__dirname, '/../', 'node_modules')))

app.use('/api/users', require('./routes/users'))
app.use('/api/boxes', require('./routes/boxes'))

//handle different errors
app.use(function (err, req, res, next)  {
  //send status code back to front end
  res.sendStatus(res.statusCode)
})

app.use((req, res) => {
  console.log("something not found")
  // res.sendStatus(404);
  res.redirect('/')
});

module.exports = app
