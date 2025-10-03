
module.exports = function find(mod, query, cb) {
  let model = require('../models/'+mod+'.js');
  let q = query.query;
  let fields = query.fields;
  //console.log(q, fields);
  model.find(q, fields, function (err, results) {
    if (err) throw err;
    cb(results);
    
  });
}
