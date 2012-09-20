var index = require('./home').index
  , user = require('./user')

module.exports = exports = function (app) {

  app.get('/', index);
  app.get('/users', user.list);

}
