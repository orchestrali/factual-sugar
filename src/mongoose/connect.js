const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

module.exports = function connect(uri, dbName) {
  mongoose.connect(uri, {dbName: dbName, useNewUrlParser: true, useUnifiedTopology: true});
  let db = mongoose.connection;
  db.on('error', console.error.bind(console, 'MongoDB connection error:'));
  
  return db;
}
