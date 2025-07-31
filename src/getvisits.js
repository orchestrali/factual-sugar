const fs = require("fs");
const buildvisits = require("./buildvisits.js");

module.exports = function getvisits(userid, cb) {
  let visits = [];
  if (fs.existsSync("/data/"+userid)) {
    console.log("directory exists");
    fs.readdir("/data/"+userid, (err, files) => {
      if (err) console.log(err);
      files.sort();
      visits = require("/data/"+userid+"/"+files[files.length-1]);
      buildvisits(visits);
      cb(visits);
    });
  } else {
    console.log("making directory");
    let name = Date.now();
    fs.mkdirSync("/data/"+userid);
    fs.writeFile("/data/"+userid+"/"+name+".json", "[]", (err) => {
      if (err) console.log(err);
      cb(visits);
    });
    
  }
  
}
