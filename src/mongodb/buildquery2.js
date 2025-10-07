const numbers = ["stage", "leadLength", "numHunts", "huntBells", "huntPath", "stationaryBells", "numWorking", "pbOrder", "leadsInCourse", "ccNum"];
const booleans = ["classification.little", "classification.differential", "classification.plain", "classification.trebleDodging", "leadtruth", "coursetruth"];
const others = ["title", "oldtitle", "name", "class", "leadHead", "leadHeadCode", "fchGroups", "symmetry", "pn", "refs", "notes"];

//mongodb query sent via query params
//is there a clever way to do this with models
module.exports = function buildquery(q) {
  let query = {};
  for (let key in q) {
    if (numbers.includes(key)) {
      if (typeof q[key] === "string") {
        query[key] = Number(q[key]);
      } else if (Array.isArray(q[key])) {
        query[key] = arrstringstonums(q[key]);
      }
    } else if (booleans.includes(key)) {
      query[key] = q[key] === "true";
    } else if (others.includes(key)) {
      query[key] = q[key];
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
