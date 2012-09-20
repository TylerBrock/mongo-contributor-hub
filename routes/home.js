
var langs;

// every 5 mins update this search result
setInterval(function updateLangs () {
  console.log('updateLangs: querying...');
  var group = {$group : {_id : "$language", count : {$sum : 1 } } };
  var sort = {$sort : {count : -1}};
  repos.aggregate(group, sort, function (err, languages) {
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
  //repos.distinct('language', function (err, langs) {
  res.render('index', { langs: langs, projects: [] });
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
