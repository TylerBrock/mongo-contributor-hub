
/**
 * Module dependencies.
 */

var mongo = require('mongodb')
  , express = require('express')
  , http = require('http')
  , path = require('path')
  , routes = require('./routes')

var uri = process.env.MONGOLAB_URI || 'mongodb://localhost/githubdata';
mongo.Db.connect(uri, function (err, db) {
  if (err) throw err;
  global.db = db;
  repos = db.collection('repos');
  console.log('connected to mongo (githubdata)');
  start();
});

function start () {
  var app = express();

  app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('your secret here'));
    app.use(express.session());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
  });

  app.configure('development', function(){
    app.use(express.errorHandler());
  });

  routes(app);

  http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
  });
}
