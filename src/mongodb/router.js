const connectsearch = require("./startconnect.js");
const buildquery = require("./buildquery.js");
const models = ["method", "performance", "oldPerformance", "name", "bbperformance", "unmethod", "variation", "call", "cycle", "leadhead", "methodab", "doublescall", "word", "bbtext"];

module.exports = async function router(model, req) {
  if (models.includes(model)) {
    let q = buildquery(req);
    console.log(q);
    let o = {model: model+"s", query: q};
    const results = await connectsearch("./findfields.js", o);
    console.log("num results: "+results.length);
    return results;
  } else {
    return {error: "no such collection"};
  }
}
