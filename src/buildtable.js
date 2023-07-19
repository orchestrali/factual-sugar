const towers = require("../public/towers.json");
const fs = require("fs");
const countyabbr = require("./countyabbr.js");

module.exports = function buildtable() {
  let table = `<tr class="divider"><td><a id="A" href="#A">A</a></td></tr>
  `;
  let letter = "A";
  for (let i = 0; i < towers.length; i++) {
    if (!towers[i].Place.startsWith(letter)) {
      letter = towers[i].Place[0];
      table += `<tr class="divider"><td><a id="${letter}" href="#${letter}">${letter}</a></td></tr>
      `;
    }
    let t = towers[i];
    let country = modcountry(t.Country, t.ISO3166code);
    let county = modcounty(t.County);
    let unring = t.UR === "u/r" ? " unringable" : "";
    let place = t.Place+", "+ (county.length ? county + ", " : "") + country;
    table += `<tr class="tower${unring}" id="t${t.RingID}">
      <td><div class="place">${place}</div>
          <div class="dedication">${t.Dedicn}, ${t.Bells} bells${unring}</div></td>
    </tr>`;
  }
  
  fs.writeFileSync("src/pages/table.hbs", table);
  console.log("done?");
}


function modcountry(c, code) {
  let country;
  switch (c) {
    case "United States of America":
      country = "USA";
      break;
    case "Island of Ireland":
      country = code === "IE" ? "Ireland" : "Northern Ireland";
      break;
    default:
      country = c;
  }
  return country;
}

function modcounty(c) {
  let county = countyabbr[c];
  return county || c;
}