
/**
 * Module dependencies
 */

var ms = require('ms')

/**
 * Languages (cached)
 */

var langs;

// update this search result once a day
setInterval(function updateLangs () {
  console.log('%s: updating languages', new Date);

  // no aggregation on pre 2.2  :(
  //var match =  {$match: { fork: false }};
  //var group = {$group : {_id : "$language", count : {$sum : 1 } } };
  //var sort = {$sort : {count : -1}};
  //repos.aggregate(match, group, sort, function (err, languages) {

  // OMG KILL ME NOW
  repos.group(
      ['language']
    , { fork: false }
    , { count: 0 }
    , function(doc,prev){ prev.count+=1 }, handleResponse);

  function handleResponse (err, languages) {
    if (err) {
      console.error('updateLangs error: ', err);
      languages || (languages = []);
    }
    languages.sort(function (a, b) {
      if (a.count > b.count) return -1;
      if (a.count < b.count) return 1;
      return 0;
    });
    langs = languages;
  }

  return updateLangs;
}(), ms('1d'))

/**
 * valid sorts
 */

var validSorts = 'followers forks'.split(' ');
var pageSize = 20;

function getSort (req, def) {
  var sort = {};

  var sortPath = req.param('sort');
  if (!~validSorts.indexOf(sortPath)) sortPath = def || 'forks';

  var order = req.param('order') | 0;
  if (1 !== order) order = -1;

  sort.key = sortPath;
  sort.order = order;
  sort.arg = {};
  sort.arg[sortPath] = order;

  return sort;
}

function getSkip (req) {
  // force int
  var page = req.param('page') | 0;
  return page * pageSize;
}

/**
 * GET home page.
 */

exports.index = function(req, res, next){
  var sort = getSort(req);
  var skip = getSkip(req);

  repos
  .find({ forks: { $gt: 50 }, fork: false }
      , { limit: pageSize, skip: skip, sort: sort.arg })
  .toArray(function (err, projects) {
    if (err) return next(err);

    projects || (projects = []);

    res.render('index', {
        langs: langs
      , projects: projects
      , page: req.param('page') | 0
      , sort: sort.key
      , order: sort.order
      , term: ''
    });
  })
};

/**
 * Click on a language
 */

exports.lang = function (req, res, next) {
  var lang = req.param('lang') || '';

  // if nothing submitted, nothing to do
  if (!(lang= lang.trim())) {
    return res.redirect('/');
  }

  // handle missing language in github
  if ('null' === lang) lang = null;

  var skip = getSkip(req);
  var sort = getSort(req);

  repos
  .find({ 'language': lang, fork: false }
      , { skip: skip, limit: pageSize, sort: sort.arg })
  .toArray(function (err, projects) {
    if (err) return next(err);

    var locals = {
        langs: langs
      , projects: projects || []
      , lang: lang
      , page: req.param('page') | 0
      , order: sort.order
      , sort: sort.key
      , term: ''
    };

    res.format({
        html: function () {
          res.render('index', locals);
        }
      , json: function () {
          res.send(locals);
        }
    })
  });
}

exports.search = function (req, res, next) {
  var term = req.param('term') || '';

  // if nothing submitted, nothing to do
  if (!(term = term.trim())) {
    return res.redirect('/');
  }

  var skip = getSkip(req);

  var rgx = new RegExp(term, 'ig');

  var query = {
      $or: [
          { name: rgx, fork: false }
        , { username: rgx, fork: false }
        , { description: rgx, fork: false }
      ]
  };

  var sort = getSort(req, 'watchers');

  var opts = { sort: sort.arg, limit: pageSize, skip: skip };

  repos.find(query, opts).toArray(function (err, projects) {
    if (err) return next(err);

    var locals = {
        langs: langs
      , projects: projects || []
      , term: term || ''
      , page: req.param('page') | 0
      , lang: ''
      , order: sort.order
      , sort: sort.key
    };

    res.format({
        html: function () {
          res.render('index', locals);
        }
      , json: function () {
          res.send(locals);
        }
    })
  });
}
