const fs = require("fs");
const testdata = require("./data.json");

module.exports = function teststuff() {
  fs.writeFile("data/testfile.json",JSON.stringify(testdata,null,2), err => {
    console.log(err);
  });
}
