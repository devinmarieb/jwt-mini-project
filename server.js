// =================================================================
// require all necessary packages & our .env config file ===========
// =================================================================

const jwt = require('jsonwebtoken')
const config = require('dotenv').config()
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
if(!config.CLIENT_SECRET || !config.USERNAME || !config.PASSWORD) {
  throw 'Make sure you have a CLIENT_SECRET, USERNAME and PASSWORD in your .env file'
}
app.set('secretKey', config.CLIENT_SECRET)


// =================================================================
// app setup & configuration =======================================
// =================================================================

app.locals.trains = [
  { id: 1, line: 'green', status: 'running' },
  { id: 2, line: 'blue', status: 'delayed' },
  { id: 3, line: 'red', status: 'down' },
  { id: 4, line: 'orange', status: 'maintenance' }
];

// Use body parser so we can get info from POST/URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

const checkAuth = (req, res, next)=> {
  // check headers / post / body/URL params for auth //
  const token = req.body.token ||
                req.param('token') ||
                req.headers['authorization']

  if(token) {
    jwt.verify(token, api.get('secretKey'), (error, decoded)=> {
      // if token is invalid or expired, respond with error //
      if(error) {
        return res.status(403).send({
          success: false,
          message: 'Invalid authorization token'
        })
      }
      // if token is valid, save, request for use in other routes
      // and continue on with next()
      else {
        req.decoded = decoded
        next()
      }
    })
  } else {
    return res.status(403).send({
      success: false,
      message: 'You must be authorized to hit this endpoint'
    })
  }
}

// =================================================================
// API Endpoints ===================================================
// =================================================================

// auth/login endpoint //
app.post('/authenticate', (req, res) => {
  const user = req.body;

// if bad creds //
  if (user.username !== config.USERNAME || user.password !== config.PASSWORD) {
    res.status(403).send({
      success: false,
      message: 'Invalid Credentials'
    })
  }

  // if good creds //
  else {
    let token = jwt.sign(user, app.get('secretKey'), {
      expiresIn: 172800 // expires in 48 hours
    })

    res.json({
      success: true,
      username: user.username,
      token: token
    })
  }
})

// get all trains endpoint //
app.get('/api/v1/trains', (req, res)=> {
  res.send(app.locals.trains)
})

// patch admins can update train status //
app.patch('/api/v1/trains/:id', checkAuth, (req, res)=> {
  const { train } = req.body
  const { id } = req.params
  const index = app.locals.trains.findIndex((m)=> m.id == id)

  if(index === -1) {
    return res.sendStatus(404)
  }

  const originalTrain = app.locals.trains[index]
  app.locals.trains[index] = Object.assign(originalTrain, train)

  return res.json(app.locals.trains)
})


// =================================================================
// start the server ================================================
// =================================================================

app.listen(3001);
console.log('Listening on http://localhost:3001');
