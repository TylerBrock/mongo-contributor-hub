var home = require('./home')
  , user = require('./user')

module.exports = exports = function (app) {

  app.get('/', home.index);
  app.get('/users', user.list);
  app.get('/lang/:lang', home.lang)

}
