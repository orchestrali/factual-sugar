const connectsearch = require("./startconnect.js");
const models = ["method", "performance", "oldPerformance", "name", "bbperformance", "unmethod", "variation", "call", "cycle", "leadhead", "methodab", "doublescall", "word", "bbtext"];
const buildquery = require("./buildquery2.js");

module.exports = async function router(model, req) {
  if (models.includes(model)) {
    let o = {model: model+"s"};
    o.query = req ? buildquery(req) : {};
    console.log(o.query);
    let path = o.query.fields ? "./findfields.js" : "./find.js";
    const results = await connectsearch(path, o);
    console.log("num results: "+results.length);
    return results;
  } else {
    return {error: "no such collection"};
  }
}
