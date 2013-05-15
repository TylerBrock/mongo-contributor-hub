#!/usr/bin/env node

/**
 * Dependencies
 */

var request  = require('superagent');
var mongo = require('mongodb');

/**
 * mongo URI
 */

var mongouri = process.env.MONGOLAB_URI || 'mongodb://localhost/githubdata';

/**
 * Github api URL
 */

var uri = 'https://api.github.com/legacy/repos/search/mongodb?start_page=';

/**
 * Establish mongo connection
 */

var repos, db;

log('starting');
mongo.Db.connect(mongouri, function (err, db_) {
  if (err) throw err;

  db = db_;
  repos = db.collection('repos');
  index(repos);

  log('connected to mongo');

  // start pulling data
  page(0, function (err) {
    log('disconnecting from mongo');

    db.close(function () {
      if (err) {
        log(err);
        return process.exit(1);
      }

      log('completed successfully');
      process.exit(0);
    });
  });
});

/**
 * Fetch a search result from Github by page number
 * and upsert our database
 *
 * This will fire recursively until either Github
 * returns an error or there are no more results.
 *
 * @param {Number} num
 * @param {Function} cb
 */

function page (num, cb) {
  var req = request.get(uri + num);
  req.on('error', cb);
  req.end(function (res) {
    console.log(typeof res, res);
    var pending = res.body && res.body.repositories && res.body.repositories.length;

    if (!pending) return cb();

    // upsert in parallel
    res.body.repositories.forEach(function (repo) {
      fix(repo);

      var match = { username: repo.username, name: repo.name };
      var options = { upsert: true, safe: true };

      repos.update(match, repo, options, function (err, res) {
        if (err) log(err);
        --pending || page(num+1, cb);
      })
    });
  })
}

/**
 * Parse github date strings into real Dates
 *
 * @param {Object} doc
 */

function fix (doc) {
  doc.created = new Date(doc.created);
  doc.created_at = new Date(doc.created_at);
  doc.pushed = new Date(doc.pushed);
  doc.pushed_at = new Date(doc.pushed_at);
}

/**
 * Log the given `msg`
 *
 * @param {String|Error} msg
 */

function log (msg) {
  var prefix = String(new Date) + ': datapull:';
  if (msg instanceof Error)
    console.error(prefix, (msg.stack || '').replace(/\n/g, '\\n'));
  else
    console.log(prefix, msg);
}

/**
 * ensure indexes
 */

function index (col) {
  log('ensuring indexes');
  col.ensureIndex({ username: 1, name: 1 }, { unique: true, safe: true }, function (err) {
    if (err) log(err);
    else log('ensuring indexes complete');
  });
}
