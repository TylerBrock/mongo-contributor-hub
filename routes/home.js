
/*
 * GET home page.
 */

exports.index = function(req, res){
  repos.count(function (err, count) {
    res.render('index', { count: count });
  });
};
