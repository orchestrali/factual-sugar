const numbers = ["stage", "leadLength", "numHunts", "huntBells", "huntPath", "stationaryBells", "numWorking", "pbOrder", "leadsInCourse", "ccNum"];
const booleans = ["classification.little", "classification.differential", "classification.plain", "classification.trebleDodging", "leadtruth", "coursetruth"];
const others = ["title", "oldtitle", "name", "class", "leadHead", "leadHeadCode", "fchGroups", "symmetry", "pn", "pnFull", "refs", "notes"];

//mongodb query sent via query params
//is there a clever way to do this with models
module.exports = function buildquery(q) {
  let query = {};
  for (let key in q) {
    let val = q[key];
    if ((val.startsWith("{") && val.endsWith("}")) || (val.startsWith("[") && val.endsWith("]"))) {
      try {
        val = JSON.parse(val);
        query[key] = val;
      } catch (error) {
        console.log("error building query");
        console.log(key, q[key]);
      }
      
    } else if (numbers.includes(key)) {
      if (typeof val === "string") {
        query[key] = Number(val);
      } else if (Array.isArray(val)) {
        query[key] = val;
          //arrstringstonums(q[key]); JSON.parse should take care of it???
      }
    } else if (booleans.includes(key)) {
      query[key] = val === "true";
    } else if (others.includes(key)) {
      query[key] = val;
    }
  }
  return query;
}

function arrstringstonums(a) {
  let arr = a.map(e => {
    if (Array.isArray(e)) {
      return arrstringstonums(e);
    } else {
      return Number(e);
    }
  });
  return arr;
}
