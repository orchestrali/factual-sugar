const places = "1234567890ETABCD";

//need some holder for method titles
var methodnames;
//separate holder for detailed method info?
var bigmethodinfo;
//holder for svg stuff
var svg;
//display option for methods: grid, lines
var gridtype = "grid";
//save bluebell choices?
//separate for each stage?
var bluebellprefs = {};
var bluebell = "auto";

//hmmm possibly only establish this when logged in?
const allmymethods = {title: "All my methods", id: "all-my-methods"};
//email?
var account;
//methods need: title, notes (array), collections (array of ids), id (m+date added), ccNum
var mymethods;
//collections are just title and id
var mycollections;

//method object from mymethods
var currentmethod;
var currentcollection;
var currentnote;
//detailed info of method being viewed
var methodobj;
var stage;
var rowarr;
//methods within a collection; options "title" or "added"
var sortby = "title";
//currently just for editing a collection...
var editing;
//searching methods
var searchval = "";


$(function() {
  $("#methodcontainer").svg({onLoad: (o) => {
    svg = o;
  }});
  
});





// ***** moving between screens?? *****






// ***** method note functions *****

function viewnoteclick(e) {
  let title = $(e.currentTarget).text();
  let id = Number($(e.currentTarget).attr("id").slice(1));
  console.log(id);
  viewnote(id, title);
}

function viewnote(id, title) {
  let note = currentmethod.notes.find(n => n.id === id);
  //console.log(note);
  $("#noteviewer h4").html(title);
  $("#notecontainer").remove();
  $("#noteviewer").append(`<pre id="notecontainer">${note.contents}</pre>`);
  currentnote = note;
  $("#methodnoteslist").hide();
  $("#noteviewer").show();
}

function editnote() {
  $("#notetitle").val(currentnote.title);
  let note = currentmethod.notes.find(n => n.id === currentnote.id);
  $("#note").val(note.contents);
  $("#noteviewer").hide();
  $("#noteeditor").show();
}

function notetitlekeyup(e) {
  $("#notetitleerror").text("");
  let title = $(e.currentTarget).val().trim();
  let existing = currentmethod.notes.map(n => n.title);
  if (currentnote) {
    let i = currentmethod.notes.findIndex(n => n.id === currentnote.id);
    existing.splice(i, 1);
  }
  if (existing.includes(title)) {
    $("#notetitleerror").text("note title already in use");
  }
}

var months = ["Jan","Feb","Mar","Apr","May", "Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
//displays new note screen
function addnote() {
  currentnote = null;
  let today = new Date();
  let date = [today.getDate(), months[today.getMonth()], today.getFullYear()];
  let string = date.join(" ");
  $("#methodnoteslist").hide();
  $("#notetitle").val(string);
  $("#noteeditor").show();
}

//{saving}
function savenote() {
  let text = $("#note").val();
  let err = $("#notetitleerror").text();
  if (text.length && !err.length) {
    let id = Date.now();
    let o = {
      title: $("#notetitle").val().trim(),
      contents: text
    };
    
    if (o.title.length === 0) o.title = "note "+(currentmethod.notes.length+1);
    if (currentnote) {
      o.id = currentnote.id;
      let i = currentmethod.notes.findIndex(n => n.id === currentnote.id);
      currentmethod.notes.splice(i, 1, o);
      $("#n"+o.id).html(o.title);
    } else {
      o.id = id;
      currentmethod.notes.push(o);
      $("#methodnoteslist ul").append(`<li id="n${o.id}">${o.title}</li>`);
    }
    
    currentnote = o;
    $("#noteeditor").hide();
    viewnote(o.id, o.title);
    
  }
  
}








// ***** method viewing functions *****



//m is a string: "cc"+ccNum
function viewmethod(m, from) {
  //remove stuff from many divs
  $("#methodbackcontainer,#methodcollections,#methodinfobox,#methodcontainer,#methodnoteslist ul,#choosecoll").contents().remove();
  $("#addmethodnote").hide();
  //"from" a collection or a search
  let button = "backto"+from;
  $("#methodbackcontainer").append(`<button id="${button}" class="back">Back to ${from}</button>`);
  //what does "m" include? need to retrieve method info from somewhere
  let mobj = example[m]; //detailed info
  stage = mobj.stage;
  methodobj = mobj;
  $("#methodtitle").text(mobj.title);
  $("#methodinfobox").append(`<ul></ul>`);
  let info = $("#methodinfobox ul");
  info.append(`<li>Place notation: ${mobj.pn}</li>`);
  
  buildrowarr();
  let lh = rowstring(rowarr[mobj.leadLength]);
  if (mobj.leadHeadCode) {
    lh += " (code "+mobj.leadHeadCode+")";
  }
  info.append(`<li>Leadhead: ${lh}</li>`);
  //need to save bluebell choice and reapply it
  $("#bluebell").html(bluebellopts(stage));
  $('#bluebell').val(bluebell);
  console.log("drawing method??");
  //this function will take view prefs into account
  drawmethod(mobj);
  
  if (account) {
    currentmethod = mymethods.find(o => o.title === mobj.title);
    if (currentmethod) {
      //display collections it's in
      $("#methodcollections").append(`<ul></ul>`);
      let ul = $("#methodcollections ul");
      let colls = currentmethod.collections;
      
      if (colls.length === 0) {
        let c = currentcollection ? ` class="selected"` : "";
        let li = `<li${c}>All my methods</li>`;
        ul.append(li);
      }
      
      colls.forEach(cid => {
        let coll = mycollections.find(c => c.id === cid);
        let c = currentcollection && currentcollection.id === cid ? ` class="selected"` : "";
        let li = `<li${c}>${coll.title}</li>`;
        ul.append(li);
      });
      //display any notes
      currentmethod.notes.forEach(o => {
        $("#methodnoteslist ul").append(`<li id="n${o.id}">${o.title}</li>`);
      });
      //display add note button
      $("#addmethodnote").show();
    } else {
      $("#methodpanel h4:first-of-type").hide();
      $("#choosecoll").append(`<option value="all-my-methods">All my methods</option>`);
      mycollections.forEach(c => {
        $("#choosecoll").append(`<option value="${c.id}">${c.title}</option>`);
      });
      $("#addtocollection").show();
    }
    //option to add method to a collection
  }
  $("#methodpanel").removeClass("hidden");
}

//info panels when viewing a method
function dropdown(e) {
  $(e.currentTarget).toggleClass("rotate");
  let which = $(e.currentTarget).parent().next();
  let id = which.attr("id");
  if ($(e.currentTarget).hasClass("rotate")) {
    let h;
    switch (id) {
      case "displayoptions":
        h = gridtype === "grid" ? "4em" : "6em";
        break;
      case "methodcollections":
        let n = which.find("li").length;
        h = (n+2) + "em";
        break;
      case "methodinfobox":
        //might need to copy methodcollections when I'm showing more properties
        //also need to deal with/stop wrapping
        h = "4em";
        break;
    }
    which.css("height", h);
  } else {
    which.css("height", 0);
  }
  
}



function bluebellopts(stage) {
  let options = `<option value="auto">auto</option>
  `;
  let pairs = [];
  for (let i = 1; i <= stage; i++) {
    options += `<option value="${i}">${i}</option>
    `;
    if (i%2 === 0) {
      pairs.push([i-1,i]);
    }
  }
  pairs.forEach(a => {
    let v = a.join("-");
    options += `<option value="${v}">${v}</option>
    `;
  });
  return options;
}

//vars needed: stage, gridtype, rowarr
//m needs to have: huntBells, leadLength
//actually do I need m? wait currentmethod is for the object in my collection
function drawmethod(m) {
  $("svg").remove();
  let bells = [];
  let rounds = places.slice(0, stage).split("").map(bellnum);
  if (gridtype === "grid") {
    bells = rounds;
  } else {
    let bb = $("#bluebell option:checked").val();
    if (bb === "auto") {
      let b = m.huntBells.length === stage ? stage : rounds.findLast(n => !m.huntBells.includes(n));
      bells.push(b);
    } else {
      bells = bb.split("-").map(n => Number(n));
    }
  }
  let width = 40 + 16*stage;
  let height = 20;
  height += 20*rowarr.length;
    //gridtype === "grid" ? m.leadLength*20 : m.leadLength*m.leadsInCourse*20;
  let grid = svg.svg($("#methodcontainer"), null, null, width, height, {class: "grid", xmlns: "http://www.w3.org/2000/svg", "xmlns:xlink": "http://www.w3.org/1999/xlink"});
  let boxgroup = svg.group(grid, {style: "fill: #eeeeee"});
  let numgroup = svg.group(grid, {style: "font-family: Arial; font-size: 14pt"});
  let huntgroup = svg.group(grid, {style: "stroke: red; stroke-width: 1; fill: none;"});
  let workgroup = svg.group(grid, {style: "stroke: blue; stroke-width: 2; fill: none;"});
  let workgreen = svg.group(grid, {style: "stroke: green; stroke-width: 2; fill: none;"});
  let linegroup = svg.group(grid, {style: "stroke: black; stroke-width: 1; fill: none;"});
  
  //y increment between leadends
  let liney = m.leadLength*20;
  let pbs = [];
  
  for (let b = 1; b <= stage; b++) {
    let hunt;
    let color;
    if (gridtype === "lines" && b%2 === 0) {
      let x = -6+16*(b-1);
      svg.rect(boxgroup, x, 10, 16, height-40);
    }
    let parent;
    if (m.huntBells.includes(b)) {
      hunt = true;
      parent = huntgroup;
    } else if (bells.length === stage) {
      parent = workgroup;
      color = "blue";
    } else {
      if (bells.length === 2 && b === bells[0]) {
        parent = workgreen;
        color = "green";
      } else if (bells.includes(b)) {
        parent = workgroup;
        color = "blue";
      }
    }
    if (parent) {
      let pp = rowarr.map(r => r.indexOf(b)+1);
      let path = buildsvgpath(pp);
      svg.path(parent, path);
      if (!hunt && gridtype === "lines") {
        for (let y = 10; y < height; y += liney) {
          let rownum = (y-10)/20;
          let p = rowarr[rownum].indexOf(b)
          let x = p*16+10;
          svg.circle(parent, x, y, 1);
          let pbx = stage*16+10;
          if (pbs.length) pbx += 15;
          svg.circle(parent, pbx, y, 6, {"stroke-width": 1});
          svg.text(parent, pbx, y+4, places[p], {style: "text-anchor: middle; font-family: Arial; font-size: 8pt; stroke: none; fill: "+color+";"});
        }
        pbs.push(b);
      }
    }
  }
  
  for (let y = liney; y < height; y+=liney) {
    svg.line(linegroup, 6, y, stage*16-2, y);
  }
  
}


//pp is array of place numbers
//uses absolute starting points, may want to update...
function buildsvgpath(pp) {
  let current = pp[0];
  let path = ["M", -6+16*current, "10"].join(" ");
  for (let i = 1; i < pp.length; i++) {
    let p = pp[i];
    if (p === current) {
      path += " v 20";
    } else if (p > current) {
      path += " l 16 20";
    } else if (p < current) {
      path += " l -16 20";
    }
    current = p;
  }
  return path;
}




// ***** bellringing functions *****

//convert bell characters to numbers
function bellnum(n) {
  return places.indexOf(n)+1;
}

//convert array of bell numbers to string of characters
function rowstring(arr) {
  let r = arr.map(n => places[n-1]);
  return r.join("");
}

//build first lead, starting with rounds
//global stage variable needs to be set!
function buildlead(pn) {
  let row = places.slice(0,stage).split("").map(bellnum);
  return buildrows(row, pn);
}

function buildrows(prev, pn) {
  let rows = [];
  pn.forEach(e => {
    let r = applypn(prev, e);
    rows.push(r);
    prev = r;
  });
  return rows;
}

//given a row and a change, apply the change
//row could be array or string, but since the result is an array array would be better
function applypn(row, pn) {
  let next = [];
  let dir = 1;
  for (let p = 0; p < row.length; p++) {
    if (pn === "x" || !pn.includes(p+1)) {
      next.push(row[p+dir]);
      dir *= -1;
    } else if (pn.includes(p+1)) {
      next.push(row[p]);
    }
  }
  return next;
}



