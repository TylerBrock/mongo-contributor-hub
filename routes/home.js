
var langs;

// every 5 mins update this search result
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
}(), 60000*5)

/*
 * GET home page.
 */

exports.index = function(req, res, next){
  repos
  .find({ forks: { $gt: 100 }, fork: false }, { limit: 20, sort: { forks: -1} })
  .toArray(function (err, projects) {
    if (err) return next(err);

    projects || (projects = []);

    // sort by last pushed date
    projects.sort(function (a, b) {
      if (a.pushed_at > b.pushed_at)
        return 1;
      if (a.pushed_at < b.pushed_at)
        return -1;
      return 0;
    });

    res.render('index', { langs: langs, projects: projects, lang: langs[0].language, page: 0 });
  })
};

exports.lang = function (req, res, next) {
  var lang = req.param('lang');

  // if nothing submitted, nothing to do
  if (!(lang= lang.trim())) return next();

  // handle missing language in github
  if ('null' === lang) lang = null;

  // force int
  var page = req.param('page') | 0;

  // calualate skip size
  var pageSize = 20;
  var skip = page * pageSize;

  repos
  .find({ 'language': lang, fork: false }, { skip: skip, limit: pageSize, sort: { followers: -1 }})
  .toArray(function (err, projects) {
    if (err) return next(err);
    res.render('index', { langs: langs, projects: projects || [], lang: encodeURIComponent(String(lang)), page: page });
  });
}

exports.search = function (req, res, next) {
  var term = req.param('term') || '';

  // if nothing submitted, nothing to do
  if (!(term = term.trim())) {
    return res.redirect('/');
  }

  // force int
  var page = req.param('page') | 0;

  var descRgx = new RegExp('\\b' + term + '\\b', 'ig');
  var nameRgx = descRgx;

  var query ={ $or: [{name: nameRgx, fork:false},{username: nameRgx, fork:false},{description: descRgx, fork:false}] };
  var opts = { sort: { watchers: -1}};
  repos.find(query, opts).toArray(function (err, projects) {
    if (err) return next(err);
    res.render('index', { langs: langs, projects: projects || [], lang: '', term: term, page: page });
  });
}
