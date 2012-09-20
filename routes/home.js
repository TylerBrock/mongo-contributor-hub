
/*
 * GET home page.
 */

exports.index = function(req, res){
  repos.distinct('language', function (err, langs) {
    res.render('index', { langs: langs });
  });
};
