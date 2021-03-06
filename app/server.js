// Requirements
var app = require('./config')



var users = require('./models/Users');
var userSocial = require('./models/UserSocial')
var pokes = require('./models/Pokes')

// ext functions for ease of use
var handler = app.mods.handler
var authorize = function(req, res, next) {
    var bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader !== 'undefined') {
        users.where('token', bearerHeader).fetch().then(result => {
          if(result!=false && result!=null) {
            req.user = result
            next();
          } else {
            return res.sendStatus(403)
          }
        }).catch(result => {
          return res.sendStatus(403);
        })
    } else {
        return res.sendStatus(403);
    }
}



// users.set({
//   username: 'taylor',
//   name: 'Taylor Christie',
//   password: app.mods.encrypt.generate('admin') // encrypt.verify(password, hash)
// }).save()

// users.getByUsername('taylor').then(function(result) {
//   console.log(result.toJSON())
// })

app.framework.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,authorization');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.framework.get('/', authorize, function(req, res) {
  return res.send('NodeJS Backend. Welcome, '+req.user.get('username'))
})

// Done, needs token verification tho
app.framework.post('/login', function(req, res) {

  if(!req.body.username || !req.body.password) {
    res.statusCode = 400;
    return res.send('bad request.')
  }


  users.getByUsername(req.body.username).then(function(result) {
    if(result != null) {
      if(app.mods.encrypt.verify(req.body.password, result.get('password'))) {
        // Set Token
        result.set('token', app.mods.jwt.sign(result.get('username')+Date.now(), app.config.JWT_SECRET));
        result.save()
        return res.json({message: 'login successful', token: result.get('token')})
      }
    }
    res.statusCode = 403;
    return res.json({message: 'login unsuccessful'})
  })
})

// Unset user token
app.framework.get('/logout', authorize, function(req, res) {
  req.user.set('token', null)
  req.user.save();
  res.send('Logged out.')
})

// Done
app.framework.post('/search', function(req, res) {

  if(!req.body.query) {
    res.statusCode = 400;
    return res.send('bad request.')
  }

  return handler(users.search(req.body.query), res, {
    errormsg: 'No results found.',
    sendData: true,
    fetchAll: true
  })

})


app.framework.get('/profile', authorize, function(req, res) {
  return res.send(req.user.toJSON())
})

app.framework.get('/profile/:id', authorize, function(req, res) {
  id = req.params.id
  return handler(users.where('id', id), res, {
    errormsg: 'User not found.',
    sendData: true
  })
})

app.framework.post('/profile', authorize, function(req, res) {
  user = req.user
  req.user.set('name', req.body.name);
  req.user.save()

  return res.send(req.user.toJSON())
})

app.framework.post('/poke', authorize, function(req, res) {

})

app.framework.listen(4300, function() {
  console.log('Listening on Port 4300')
})
