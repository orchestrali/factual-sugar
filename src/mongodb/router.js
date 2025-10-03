const connectsearch = require("./startconnect.js");
const models = ["method", "performance", "oldPerformance", "name", "bbperformance", "unmethod", "variation", "call", "cycle", "leadhead", "methodab", "doublescall", "word", "bbtext"];

module.exports = async function router(model, req) {
  if (models.includes(model)) {
    let o = {model: model+"s", query: JSON.parse(req)};
    const results = await connectsearch(o);
    console.log("num results: "+results.length);
    return results;
  } else {
    return {error: "no such collection"};
  }
}
