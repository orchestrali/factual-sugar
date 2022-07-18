var towers;
var sortowers;
var distances;
var view = "all";
var currentloc;
var currenttower;
var currentvisit;
var sortby = "place";
var email;
var visits;
var visited = [];
var visitid = 1;
var saving = false;

$(function() {
  
  $.get("towers.json", function(data) {
    towers = data;
    //buildtable();
    if (localStorage.getItem("email")) {
      //console.log("email stored");
      email = localStorage.getItem("email");
      $("#g_id_onload").detach();
      $(".login").hide();
      $("p.known").text("Logged in as "+email);
      setupvisits();
    } else {
      $(".login").show();
      $(".known").hide();
    }
    setupsort();
    setupnav();
    locate();
  });
  //switch between all towers, nearby, my towers
  $(".view").on("click", (e) => {
    let id = e.currentTarget.id;
    if (id != view) {
      currenttower = null;
      currentvisit = null;
      switch (id) {
        case "nearby":
          //need to trigger an update of the location at some point
          $("#container,#mylist,#towerdetail,#sortby,#newvisit,#visitdetail").hide();
          $("#list").show();
          
          break;
        case "all":
          $("#list,#mylist,#towerdetail,#newvisit,#visitdetail").hide();
          $("#container,#sortby").show();
          break;
        case "mytowers":
          $("#list,#container,#towerdetail,#sortby,#newvisit,#visitdetail").hide();
          $("#mylist").show();
      }
      $(".view.selected").removeClass("selected");
      $("#"+id).addClass("selected");
      view = id;
    }
    
  });
  
  $("#signout").on("click", signout);
  
  //sort complete list
  $("#sortby div").on("click", sorttowers);
  
  //view tower detail
  $("body").on("click", "tr.tower", (e) => {
    $("#towerdetail ul").children().remove();
    
    let id = Number(e.currentTarget.id.slice(1));
    let tower = towers.find(t => t.TowerID === id);
    if (tower) {
      currenttower = tower;
      $("#detail").append(towerdetail(tower));
    }
    
    if (visited.includes(id)) {
      $("#towervisits").append(`<li class="header">Previous visits</li>`);
      visits.filter(v => v.towerID === id).forEach(v => {
        $("#towervisits").append(`<li id="l${v.id}">${v.date}</li>`);
      });
    }
    $("#container,#list").hide();
    $("#towerdetail").show();
  });
  
  //view visit detail from my towers
  $("#mylist").on("click", "tr", visitdetail);
  
  $("#towervisits").on("click", "li", visitdetail);
  $("#savevisit").on("click", savevisit);
  $(".delete").on("click", delvisit);
  
  $("#towerdetail").on("click", ".back", (e) => {
    currenttower = null;
    $("#towerdetail").hide();
    view === "all" ? $("#container").show() : $("#list").show();
  });
  $("#visitdetail").on("click", ".back", (e) => {
    $("#visitdetail").hide();
    currentvisit = null;
    if (view === "mytowers") {
      currenttower = null;
      $("#mylist").show();
    } else {
      $("#towerdetail").show();
    }
  });
  $("#newvisit").on("click", ".back", (e) => {
    $("#newvisit").hide();
    view === "mytowers" ? $("#visitdetail").show() : $("#towerdetail").show();
  });
  
  
  $("#towerdetail").on("click", "li.bells", (e) => {
    $(e.currentTarget).children("table").slideToggle(400);
  });
  
  $(".add").on("click", addvisit);
  $(".edit").on("click", editvisit);
  
});

var countries = {
  "Australia": "Aus",
  "Belgium": "Bel",
  "Canada": "Can",
  "Caribbean": "Car",
  "Channel Islands": "CI",
  "England": "Eng",
  "France": "Fra",
  "India": "Ind",
  "Island of Ireland": "Ire",
  "Isle of Man": "IM",
  "Kenya": "Ken",
  "Netherlands": "Net",
  "New Zealand": "NZ",
  "Pakistan": "Pak",
  "Scotland": "Sco",
  "Singapore": "Sin",
  "South Africa": "SA",
  "Spain": "Spa",
  "United States of America": "USA",
  "Wales": "Wal",
  "Zimbabwe": "Zim"
};

function setupnav() {
  $("tr.divider a").each((i,elem) => {
    let id = sortby === "numbells" ? elem.id.slice(1) : sortby === "lbs" ? elem.id.slice(3) : elem.id;
    $("#nav ul").append(`<li><a href="${$(elem).attr("href")}">${id}</a></li>`);
  });
}

function setupsort() {
  sortowers = [];
  for (let i = 0; i < towers.length; i++) {
    let t = towers[i];
    let o = {i: i, place: t.Place, country: t.Country, code: countries[t.Country], bells: t.Bells, id: t.TowerID, lbs: t.Wt};
    sortowers.push(o);
  }
}

function signout() {
  $(".known").hide()
  $("#visits tr,span").remove();
  visits = [];
  visited = [];
  visitid = 1;
  localStorage.removeItem("email");
  email = "";
  $(".login").show();
}

function setupvisits() {
  $.post("/", {email: email}, (vis) => {
    visits = vis;
    for (let i = 0; i < visits.length; i++) {
      $("#visits").append(`<tr id="v${visits[i].id}"><td>${visits[i].place}</td><td>${visits[i].date}</td></tr>`);
      if (visits[i].id >= visitid) visitid = visits[i].id + 1;
      if (!visited.includes(visits[i].towerID)) {
        visited.push(visits[i].towerID);
        $("#t"+visits[i].towerID+" .dedication").append("<span> ✓ visited</span>");
        $("#n"+visits[i].towerID+" .dedication").append("<span> ✓ visited</span>");
      }
    }
  });
  
}

function visitdetail(e) {
  $("#visitdetail ul").remove();
  let id = Number(e.currentTarget.id.slice(1));
  let visit = visits.find(v => v.id === id);
  if (visit) {
    $("#visitdetail").append(vdetail(visit));
    let tid = visit.towerID;
    currenttower = towers.find(t => t.TowerID === tid);
  }
  currentvisit = visit;
  $("#mylist,#towerdetail").hide();
  $("#visitdetail").show();
}

function addvisit(e) {
  let t = currenttower;
  let today = new Date();
  $("#year").val(today.getFullYear());
  $("#day").val(today.getDate());
  let m = today.getMonth() +2;
  $("#month option:nth-child("+m+")").prop("selected", true);
  let place = buildplace(t);
  $("#notes").val("");
  $("#towerinfo").children().remove();
  $("#towerinfo").append(`<div class="place">${place}</div><div class="dedication">${t.Dedicn}</div>`);
  $("#towerdetail,#visitdetail").hide();
  $("#newvisit").show();
}
function editvisit(e) {
  let t = currenttower;
  let v = currentvisit;
  let date = v.date.split("-");
  $("#year").val(date[0]);
  $("#month").val(date[1]);
  $("#day").val(Number(date[2]));
  let place = buildplace(t);
  $("#notes").val(v.notes);
  $("#towerinfo").children().remove();
  $("#towerinfo").append(`<div class="place">${place}</div><div class="dedication">${t.Dedicn}</div>`);
  $("#towerdetail,#visitdetail").hide();
  $("#newvisit").show();
}

function delvisit(e) {
  $(".delete").text("Deleting...");
  let o = {email: email, visit: currentvisit.id};
  $.post("/delete", o, (res) => {
    $(".delete").text("Delete visit");
    if (res === "error") {
      alert("Oh no, there was an error deleting this visit. Please try again later!");
    } else {
      let id = currentvisit.id;
      let tid = currentvisit.towerID;
      $("#v"+id).remove();
      $("#l"+id).remove();
      let i = visits.findIndex(v => v.id === id);
      if (i > -1) visits.splice(i, 1);
      if (visits.filter(v => v.towerID === tid).length === 0) {
        $("#t"+tid +" .dedication span").remove();
        $("#n"+tid +" .dedication span").remove();
        visited = visited.filter(v => v != tid);
      }
      $("#visitdetail").hide();
      currentvisit = null;
      view === "mytowers" ? $("#mylist").show() : $("#towerdetail").show();
    }
  });
}

function savevisit(e) {
  if (!saving) {
    saving = true;
  
  $("#savevisit").text("Saving...");
  $("#newvisit p").text("");
  let date = ["#year","#month","#day"].map(i => {
    let val = $(i).val();
    return Number(val) < 10 && i === "#day" ? "0"+val : val;
  });
  let o = {
    email: email,
    obj: {
      id: currentvisit ? currentvisit.id : visitid,
      towerID: currenttower.TowerID,
      date: date.join("-"),
      notes: $("textarea#notes").val()
    }
  };
  //console.log(o.obj.date);
  if (o.obj.date.length === 10) {
    $.post("/visit", o, (res) => {
      if (res === "ok") {
        $("#savevisit").text("Saved!");
        setTimeout(function() {
          let vis = o.obj;
          vis.place = currenttower.Place + ", " + currenttower.Dedicn;
          let j = visits.findIndex(v => v.id === vis.id);
          let i = visits.findIndex(v => v.date < vis.date);
          if (j > -1) {
            visits.splice(j, 1, vis);
          } else if (i === -1) {
            visits.push(vis);
            $("#visits").append(`<tr id="v${vis.id}"><td>${vis.place}</td><td>${vis.date}</td><tr>`);
          } else {
            visits.splice(i, 0, vis);
            $("#visits > tr:nth-child("+(i+1)+")").before(`<tr id="v${vis.id}"><td>${vis.place}</td><td>${vis.date}</td><tr>`);
          }

          if (!visited.includes(vis.towerID)) {
            visited.push(vis.towerID);
            $("#t"+vis.towerID+" .dedication").append(`<span> ✓ visited</span>`);
            $("#n"+vis.towerID+" .dedication").append(`<span> ✓ visited</span>`);
          }

          if (view !== "mytowers") {
            $("#towervisits").children().remove();
            $("#towervisits").append(`<li class="header">Previous visits</li>`);
            visits.filter(v => v.towerID === vis.towerID).forEach(v => {
              $("#towervisits").append(`<li id="l${v.id}">${v.date}</li>`);
            });
          }

          if (!currentvisit) visitid++;
          currentvisit = vis;
          $("#visitdetail ul").remove();
          $("#visitdetail").append(vdetail(vis));
          $("#newvisit").hide();
          $("#visitdetail").show();
          saving = false;
          $("#savevisit").text("Save");
        }, 200);
      } else {
        alert("Oh no, there was an error saving your visit. Please try again later!");
        saving = false;
        $("#savevisit").text("Save");
      }
      //console.log(res);
      
      
    });
  } else {
    $("#newvisit p").text("Please select a complete date for your visit");
    saving = false;
  }
  }
}



function handlelogin(response) {
  let cred = window.jwt_decode(response.credential);
  if (cred.email_verified) {
    email = cred.email;
    localStorage.setItem("email", email);
    $(".login").hide();
    $("p.known").text("Logged in as "+email);
    $(".known").show();
    setupvisits();
  }
  //["email","email_verified"];
}

function sorttowers(e) {
  let sort = e.currentTarget.id;
  if (sort != sortby && sort != "sort") {
    sortby = sort;
    switch (sort) {
      case "place": case "country":
        sortalpha(sort);
        break;
      case "numbells":
        sortowers.sort((a,b) => a.bells-b.bells);
        break;
      case "lbs":
        sortowers.sort((a,b) => a.lbs-b.lbs);
        break;
    }
    $("#sortby .selected").removeClass("selected");
    $("#"+sort).addClass("selected");
    rearrange(sort);
  }
  
}

function sortalpha(key) {
  sortowers.sort((a,b) => {
    let aval = a[key].toUpperCase();
    let bval = b[key].toUpperCase();
    if (aval < bval) {
      return -1;
    } else if (aval > bval) {
      return 1;
    } else {
      return 0;
    }
  });
}

function builddivider(t) {
  switch (sortby) {
    case "place":
      return t.place[0];
      break;
    case "country":
      return t.code;
      break;
    case "numbells":
      return "b"+t.bells;
      break;
    case "lbs":
      return "cwt"+Math.floor(t.lbs/112);
      break;
  }
}

function rearrange() {
  $("tr.divider").remove();
  $("#nav ul li").remove();
  let divider = builddivider(sortowers[0]);
  $("#alltowers").append(`<tr class="divider"><td><a href="#${divider}" id="${divider}">${sortby === "numbells" ? sortowers[0].bells : sortby === "lbs" ? divider.slice(3)+"cwt" : divider}</a></td></tr>`);
  for (let i = 0; i < sortowers.length; i++) {
    let next = builddivider(sortowers[i]);
    if (next != divider) {
      $("#alltowers").append(`<tr class="divider"><td><a href="#${next}" id="${next}">${sortby === "numbells" ? sortowers[i].bells : sortby === "lbs" ? next.slice(3)+"cwt" : next}</a></td></tr>`);
      divider = next;
    }
    let id = "t"+sortowers[i].id;
    $("#alltowers").append($("#"+id).detach());
  }
  setupnav();
}


function locate() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(sortnear,locError);
  } else {
    $("#list").append("<p>No support for geolocation</p>");
  }
}

function locError() {
  $("#list").append("<p>Unable to retrieve your location</p>");
}

function sortnear(pos) {
  distances = [];
  if (!towers.length) {
    $("#list").append("<p>Sorry, error retrieving tower info</p>");
  } else {
    
  
    for (let i = 0; i < towers.length; i++) {
      let o = {i: i};
      o.h = Math.hypot(pos.coords.latitude-towers[i].Lat, pos.coords.longitude-towers[i].Long);
      o.d = Math.round(getDistanceFromLatLonInKm(pos.coords.latitude,pos.coords.longitude,towers[i].Lat,towers[i].Long)*1000)/1000;
      distances.push(o);
    }
    //console.log(pos.coords);
    distances.sort((a,b) => {
      return a.d-b.d;
    });
    $("#list").children().remove();
    $("#list").append("<table></table>");
    for (let i = 0; i < 20; i++) {
      let j = distances[i].i;
      display(towers[j],distances[i]);
    }
  }
}

//abbreviated
function buildplace(t) {
  let places = [t.Place];
  let country = modcountry(t.Country, t.ISO3166code);
  let county = modcounty(t.County);
  if (county.length) places.push(county);
  places.push(country);
  return places.join(", ");
}

function display(t,d) {
  //console.log(t.UR);
  let places = buildplace(t);
  let visit = visited.includes(t.TowerID) ? "<span> ✓ visited</span>" : "";
  let html = `<tr id="n${t.TowerID}" class="tower${(t.UR === "u/r" ? " unringable" : "")}"><td class="distance">${d.d}km</td><td><div class="place">${places}</div><div class="dedication">${t.Dedicn}, ${t.Bells} bells${visit}</div></td></tr>`;
  $("#list table").append(html);
}

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
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



var countyabbr = {
  Bedfordshire: "Beds",
  Berkshire: "Berks",
  Buckinghamshire: "Bucks",
  Cambridgeshire: "Cambs",
  Cumberland: "Cumb",
  Derbyshire: "Derbs",
  Gloucestershire: "Glos",
  Hampshire: "Hants",
  Herefordshire: "Heref",
  Hertfordshire: "Herts",
  Huntingdonshire: "Hunts",
  Lancashire: "Lancs",
  Leicestershire: "Leics",
  Lincolnshire: "Lincs",
  Northamptonshire: "Northants",
  Northumberland: "Northumb",
  Nottinghamshire: "Notts",
  Oxfordshire: "Oxon",
  Shropshire: "Shrops",
  Staffordshire: "Staffs",
  Warwickshire: "Warks",
  Westmorland: "Westm",
  Wiltshire: "Wilts",
  Worcestershire: "Worcs",
  Yorkshire: "Yorks",
  Breconshire: "Brecks",
  Cardiganshire: "Cards",
  Carmarthenshire: "Carms",
  Flintshire: "Flints",
  Glamorgan: "Glam",
  Montgomeryshire: "Mont",
  Pembrokeshire: "Pembs",
  Radnorshire: "Rads",
  Massachusetts: "MA",
  Pennsylvania: "PA",
  "New York": "NY",
  Maryland: "MD",
  "New Jersey": "NJ",
  "Delaware": "DE",
  Virginia: "VA",
  "North Carolina": "NC",
  "South Carolina": "SC",
  Georgia: "GA",
  Florida: "FL",
  Alabama: "AL",
  Louisiana: "LA",
  Texas: "TX",
  Illinois: "IL",
  Michigan: "MI",
  Washington: "WA",
  Hawaii: "HI",
  "District of Columbia": "DC",
  Tennessee: "TN",
  Arkansas: "AR",
  Connecticut: "CT",
  "Australian Capital Territory": "ACT",
  "New South Wales": "NSW",
  "Northern Territory": "NT",
  Queensland: "Qld",
  "South Australia": "SA",
  Victoria: "Vic",
  "Western Australia": "WA",
  Tasmania: "Tas"
}
function modcounty(c) {
  let county = countyabbr[c];
  return county || c;
}

function buildtable() {
  $("#alltowers").append(`<tr class="divider"><td>A</td></tr>`);
  let letter = "A";
  for (let i = 0; i < towers.length; i++) {
    if (!towers[i].Place.startsWith(letter)) {
      letter = towers[i].Place[0];
      $("#alltowers").append(`<tr class="divider"><td><a id="a" href="#">${letter}</a></td></tr>`);
    }
    let t = towers[i];
    let country = modcountry(t.Country, t.ISO3166code);
    let county = modcounty(t.County);
    let unring = t.UR === "u/r" ? " unringable" : "";
    $("#alltowers").append(`<tr class="tower${unring}" id="t${t.TowerID}">
      <td><div class="place">${t.Place}, ${county}, ${country}</div>
          <div class="dedication">${t.Dedicn}, ${t.Bells+unring}</div></td>
    </tr>`);
  }
  
}

function vdetail(v) {
  let t = towers.find(o => o.TowerID === v.towerID);
  let html = `<ul>
    <li>${t.Place}, ${t.County}, ${t.Country}</li>
    <li>${t.Dedicn}</li>
    <li>Visited ${v.date}</li>
    <li>Notes: ${v.notes}</li>
  </ul>`;
  return html; //need to have edit & delete buttons
}

function towerdetail(t) {
  let bells = `<table class="bells"><thead><tr><th>Bell</th><th>Weight</th><th>Cast date</th></tr></thead>`;
  t.bells.forEach(b => {
    bells += `<tr><td>`+b.BellRole+`</td><td>`+b.weight+`</td><td>`+b.CastDate+`</td></tr>`;
  });
  bells += `</table>`;
  let html = `
    <li>${t.Place}, ${t.County}, ${t.Country}</li>
    <li>${t.Dedicn}</li>
    <li><a href="https://www.google.com/maps/@${t.Lat},${t.Long},17z?hl=en" target="blank">${t.Lat}, ${t.Long}</a></li>
    <li>${t.Bells} bells, ${t.weight} in ${t.Note}</li>
    <li class="bells">
      Click here to see bell details ${bells}
    </li>
    <li><a href="${t.WebPage}" target="blank">${t.WebPage}</a></li>
    <li><a href="https://dove.cccbr.org.uk/detail.php?tower=${t.TowerID}" target="blank">Page in Dove's Guide</a></li>
    <li>${t.Practice.length ? "Practice " + t.Practice : "no practice info"}</li>
  `;
  var keys = ["Place","County","Country","Dedicn","Bells","weight","Note","Lat","Long","Toilet","Simulator","WebPage","GF","Postcode","Practice","ExtraInfo"];
  if (t.GF.length) {
    html += `<li>Ground floor ring</li>`;
  }
  if (t.Toilet.length) {
    html += `<li>Toilet</li>`;
  }
  html += `<li>`+t.ExtraInfo+`</li>`;
  return html;
}