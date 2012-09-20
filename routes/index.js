var index = require('./home').index
  , user = require('./routes/user')

module.exports = exports = function (app) {

  app.get('/', index);
  app.get('/users', user.list);

}
