
/**
 * Module dependencies.
 */

var mongo = require('mongodb')
  , express = require('express')
  , http = require('http')
  , path = require('path')
  , routes
  , errors

var uri = process.env.MONGOLAB_URI || 'mongodb://localhost/githubdata';
mongo.Db.connect(uri, function (err, db) {
  if (err) throw err;
  global.db = db;
  repos = db.collection('repos');
  console.log('connected to mongo (githubdata)');

  // execute routes after db has opened
  routes = require('./routes')
  errors = require('./routes/errors')

  // init the http server
  start();
});

function start () {
  var app = express();

  app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon(__dirname + '/public/favicon.ico'));

    app.use(express.logger('dev'));
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.bodyParser());
  });

  app.configure('development', function(){
    app.use(express.errorHandler());
  });

  routes(app);
  errors(app);

  http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
  });
}
