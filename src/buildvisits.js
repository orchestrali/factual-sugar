const towers = require("../public/towers.json");

//visits coming in have four params
//id: number
//towerID: number
//date: YYYY-MM-DD
//notes: string
module.exports = function buildvisits(arr) {
  for (let i = 0; i < arr.length; i++) {
    let t = towers.find(o => o.TowerID === arr[i].towerID);
    if (t) {
      arr[i].place = t.Place + ", " + t.Dedicn;
    }
  }
}