
module.exports = exports = function (app) {
  app.use(function (req, res, next) {
    res.send(404);
  });

  app.use(function (err, req, res, next) {
    res.status = 500;
    res.format({
      'text': function () {
        res.send('Uh oh, something went wrong.');
      },
      'json': function () {
        res.json({ err: 'Uh oh, something went wrong.' });
      },
      'html': function () {
        res.render('error', err);
      }
    });
  })
}
