const fs = require("fs");


module.exports = function delvisit(obj, cb) {
  let id = obj.email;
  let path = "data/"+id+".json";
  let files = fs.readdirSync("data/"+id);
  files.sort();
  let oldpath = "data/" + id +"/"+ files[files.length-1];
  let visits = require("../"+oldpath);
  let i = visits.findIndex(v => v.id == obj.visit);
  console.log(i);
  if (i > -1) {
    visits.splice(i,1);
  }
  let file = Date.now();
  let npath = "data/"+id+"/"+file+".json";
  fs.writeFile(npath,JSON.stringify(visits,null,2), cb);
}