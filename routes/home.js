
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
  repos.find({ forks: { $gt: 100 }}, { limit: 20, sort: { forks: -1 }}, function (err, projects) {
    if (err) return next(err);
    res.render('index', { langs: langs, projects: projects || [] });
  })
};

exports.lang = function (req, res, next) {
  var lang = req.param('lang');

  repos
  .find({ 'language': lang }, { limit: 20, sort: { followers: 1 }})
  .toArray(function (err, langs) {
    if (err) return next(err);

    // todo use a different view
    res.render('index', { langs: langs || [] });
  });
}
