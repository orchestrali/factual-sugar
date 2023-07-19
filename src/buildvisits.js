const towers = require("../public/towers.json");

//visits coming in have five params
//id: number
//towerID: number
//ringID: number
//date: YYYY-MM-DD
//notes: string
module.exports = function buildvisits(arr) {
  for (let i = 0; i < arr.length; i++) {
    let t = towers.find(o => o.RingID === arr[i].ringID);
    if (t) {
      arr[i].place = t.Place + ", " + t.Dedicn;
    }
  }
}