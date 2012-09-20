
var langs;

// every 5 mins update this search result
setInterval(function updateLangs () {
  console.log('updateLangs: querying...');
  var match =  {$match: { fork: false }};
  var group = {$group : {_id : "$language", count : {$sum : 1 } } };
  var sort = {$sort : {count : -1}};
  repos.aggregate(match, group, sort, function (err, languages) {
    if (err) {
      console.error('updateLangs error: ', err);
      languages || (languages = []);
    }
    langs = languages;
  });
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

    res.render('index', { langs: langs, projects: projects });
  })
};

exports.lang = function (req, res, next) {
  var lang = req.param('lang');
  var page = req.param('page') || 0;

  repos
  .find({ 'language': lang }, { skip: page, limit: 20, sort: { followers: 1 }})
  .toArray(function (err, langs) {
    if (err) return next(err);

    // TODO use a different view
    res.render('index', { langs: langs || [], projects: [] });
  });
}

exports.search = function (req, res, next) {
  var term = req.param('term');
  if (!(term = term.trim())) return next();

  var descRgx = new RegExp(term, 'ig');
  var nameRgx = new RegExp(term, 'ig');
  repos.find({ $or: [{name: nameRgx, fork:false},{username: nameRgx, fork:false},{description: descRgx, fork:false}] }, { sort: { watchers: -1}}).toArray(function (err, projects) {
    if (err) return next(err);
    res.send(projects);
  });
}
