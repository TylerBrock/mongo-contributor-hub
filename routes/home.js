
/*
 * GET home page.
 */

exports.index = function(req, res, next){
  repos.distinct('language', function (err, langs) {
    if (err) return next(err);
    res.render('index', { langs: langs || [] });
  });
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
