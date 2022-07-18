const fs = require("fs");


module.exports = function savevisits(obj, cb) {
  //console.log(obj["obj[date]"]);
  let id = obj.email;
  let files = fs.readdirSync("data/"+id);
  files.sort();
  let oldpath = "data/" + id +"/"+ files[files.length-1];
  if (files.length > 9) {
    fs.rmSync("data/"+id+"/"+files[0]);
  }
  let visits = require("../"+oldpath);
  let v = {};
  ["id","towerID","date","notes"].forEach((w,i) => v[w] = i < 2 ? Number(obj["obj["+w+"]"]) : obj["obj["+w+"]"]);
  let date = v.date;
  let j = visits.findIndex(o => o.id == v.id);
  let i = visits.findIndex(o => o.date < date);
  if (j > -1) {
    visits.splice(j, 1, v);
  } else if (i === -1) {
    visits.push(v);
  } else {
    visits.splice(i, 0, v);
  }
  //console.log(v);
  let file = Date.now();
  let npath = "data/"+id+"/"+file+".json";
  fs.writeFile(npath,JSON.stringify(visits,null,2), (err) => {
    if (err) {
      console.log(err);
      if (fs.existsSync(npath)) {
        fs.rmSync(npath);
      }
      cb(v);
    } else {
      cb();
    }
  });
  
}