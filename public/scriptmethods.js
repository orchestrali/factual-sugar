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
//needs to have: pnFull, leadsInCourse, leadLength
var methodobj;
var stage;
var rowarr;
//methods within a collection; options "title" or "added"
var sortby = "title";
//currently just for editing a collection...
var editing;
//searching methods
var searchparams = {};
var searchval = "";

//{saving} - parts where I need to save user input
//[todo] - stuff to write or edit!


$(function() {
  $("#viewcollections,#addmethods").hide();
  getmethods();
  $("#methodcontainer").svg({onLoad: (o) => {
    svg = o;
  }});

  //big button clicks
  $("#abandon").on("click", homeview);
  $("#viewcollections").on("click", homeclick);
  $("#stayonpage").on("click", () => $("#alert").hide());

  //method search functions
  $("#addmethods").on("click", searchmethods);
  $("#methodclass,#methodstage").on("change", buildmethodlist);
  //$("#methodsearch").on("keyup", methodkeyup);
  $("#methodnamelist").on("click", "li", (e) => {
    $("li.selected").removeClass("selected");
    $(e.currentTarget).addClass("selected");
    $("#addingdiv").addClass("hidden");
    $("#methodbuttons").show();
  });
  $("#viewmethod").on("click", viewfromsearch);

  //method functions
  $("#displayopts").on("change", toggledisplay);
  $("#bluebell").on("change", bluebellchange);
  $("#collectionpanel").on("click", "td:first-child", methodclick);
  $("#methodbackcontainer").on("click", "button", backfrommethod);
  $(".arrow").on("click", dropdown);

  //note functions
  $("#addmethodnote").on("click", addnote);
  $("#savenote").on("click", savenote);
  $("#methodnoteslist").on("click", "li", viewnoteclick);
  $("#noteback").on("click", () => {
    $("#noteviewer").hide();
    $("#methodnoteslist").show();
  });
  $("#editnote").on("click", editnote);
  $("#notetitle").on("keyup", notetitlekeyup);

  //collection functions
  $("#collectionlist").on("click", "td.collection", collclick);
  $("#colltitle,#titleedit").on("keyup", colltitlekeyup);
  $("#newcollection").on("click", () => $("#newcollpanel").removeClass("hidden"));
  $("#savecoll").on("click", savenewcoll);
  $("#editcollection").on("click", editcollection);
  $("#cancelcolledits").on("click", cancelcolledits);
  $("#collectionpanel").on("click", ".remove", removecollmethod);
  $("#savecolledits").on("click", savecolledits);
  $("#collectionlist").on("click", ".remove", removecoll); //not functional yet
  
});




//get the methods!
function getmethods() {
  $("#screens").append(`<p id="temp">Loading methods...</p>`);
  let o = {
    fields: "title stage class ccNum pn pnFull leadsInCourse leadHeadCode leadLength",
    stage: "4;5;6;7;8;9;10;11;12"
  };

  $.post("/find/method", o, (mm) => {
    bigmethodobj = {};
    methodnames = [{stage: 4, classes: []},{stage: 5, classes: []},{stage: 6, classes: []},{stage: 7, classes: []},{stage: 8, classes: []}, {stage: 9, classes: []}, {stage: 10, classes: []}, {stage: 11, classes: []}, {stage: 12, classes: []}];
    mm.forEach(m => {
      let small = {title: m.title, cc: "cc"+m.ccNum};
      let stageo = methodnames[m.stage-4];
      let co = stageo.classes.find(obj => obj.class === m.class);
      if (co) {
        co.methods.push(small);
      } else {
        stageo.classes.push({class: m.class, methods: [small]});
      }
      bigmethodobj[small.cc] = m;
    });
    console.log("methods retrieved");
    
    
    setupuser();
    buildmethodlist();
    $("#temp").remove();
    $("#addmethods").show();
  });
}

//get saved stuff
//preliminary version with local storage
function setupuser() {
  if (localStorage.getItem("account")) {
    account = localStorage.getItem("account");
    mymethods = JSON.parse(localStorage.getItem("mymethods"));
    mycollections = JSON.parse(localStorage.getItem("mycollections"));
  } else {
    account = "accountname";
    mymethods = [];
    mycollections = [];
  }
  buildcollections();
}

function savelocal() {
  localStorage.setItem("account", account);
  localStorage.setItem("mymethods", JSON.stringify(mymethods));
  localStorage.setItem("mycollections", JSON.stringify(mycollections));
}



// ***** moving between screens?? *****

//search screen
function searchmethods() {
  $("#collectionlist,#collectionpanel,#addmethods").hide();
  $("#methodpanel").addClass("hidden");
  $("#addmethodscreen,#viewcollections").show();
}

//attempt to return to my collections
function homeclick() {
  if (editing) {
    $("#alert").show();
  } else {
    homeview();
  }
}

//return to my collections
function homeview() {
  $("#addmethodscreen,#collectionpanel,#methodpanel,#alert,#viewcollections").hide();
  //reset stuff
  editing = false;
  collectionedits = [];
  currentmethod = null;
  currentcollection = null;
  currentnote = null;
  $("#collectionlist,#addmethods").show();
}

function backfrommethod(e) {
  let what = $(e.currentTarget).attr("id").slice(6);
  $("#methodpanel").addClass("hidden");
  currentmethod = null;
  if (what === "collection") {
    $("#collectionpanel").show();
  } else {
    //search
  }
}

//from within a collection
function methodclick(e) {
  let cc = $(e.currentTarget).parent().attr("id");
  let from = "collection";
  
  if (bigmethodobj[cc]) {
    $("#collectionpanel").hide();
    viewmethod(cc, from);
  }
}

//view method via search
function viewfromsearch(e) {
  let id = $("#methodnamelist li.selected").attr("id");
  let from = "search";
  
  if (id.startsWith("cc")) {
    $("#addmethodscreen").hide();
    viewmethod(id, from);
  }
}

//view collection from list
function collclick(e) {
  $("#viewcollections").show();
  let cid = $(e.currentTarget).parent().attr("id");
  viewcoll(cid);
}




// ***** method search functions *****

const stagenames = ["Minimus", "Doubles", "Minor", "Triples", "Major", "Caters", "Royal", "Cinques", "Maximus"];
//build method title list
function buildmethodlist() {
  $("#methodnamelist ul").contents().remove();
  let methodset = searchparamstuff(); //get this based on search terms
  let stagename = stagenames[searchparams.stage-4];
  if (methodset.length === 0) {
    $("#methodnamelist ul").append(`<li>No ${searchparams.class} ${stagename} methods exist!</li>`);
  }
  
  methodset.forEach((m,i) => {
    let name = m.title.slice(0,-stagename.length-1);
    let cc = m.cc;
    let mine = mymethods ? mymethods.find(o => o.title === m.title) : null;
    if (mine) name = "✓ "+name;
    let id = cc ? cc : "um"+i;
    //if (name.endsWith(" Bob")) name = name.slice(0, -4);
    $("#methodnamelist ul").append(`<li id="${id}">${name}</li>`);
  });
}

function searchparamstuff() {
  searchparams.stage = Number($("#methodstage").val());
  searchparams.class = $("#methodclass option:checked").text();
  let classo = methodnames[searchparams.stage-4].classes.find(o => o.class === searchparams.class);
  if (classo) {
    return classo.methods.sort((a,b) => a.title.localeCompare(b.title));
  } else {
    return [];
  }
}

//[todo]
function methodkeyup(e) {
  
}

function filtermethodlist(value) {
  $("#methodnamelist li").filter(function() {
    let text = $(this).text().toLowerCase();
    $(this).toggle(checkname(text, value));
  });
}

function checkname(name, val) {
  let names = [name];
  let vals = [val];

  //includes something not a-z, a space, or 0-9
  if (/[^a-z\s0-9]/.test(name)) {
    let altname = respell(name);
    if (altname != name) names.push(altname);
    names.forEach(n => {
      if (n.includes("'")) {
        
      }
    });
  }
  
  if (/[^a-z\s0-9]/.test(val)) {
    let altval = respell(val);
    if (altval != val) vals.push(altval);
  }
  
  let res = false;
  let i = 0, j = 0;
  do {
    res = names[i].indexOf(vals[j]) > -1;
    j++;
    if (j === vals.length) {
      j = 0;
      i++;
    }
  } while (!res && (i < names.length-1 || (i === names.length-1 && j < vals.length)));
  
  return res;
}

function respell(name) {
  //'.()!-?&,£="/₃₁²™
  //éèëøůáčöåòùûàóìäúñṟāêæâîü
  let lstr = "áàäâāåčçéèëêēe̊íìïîīñóòöôōo̊øṟřšśúùüûūůæ₃₁²™";
  let letters = {
    a: "áàäâāå",
    ae: "æ",
    c: "čç",
    e: "éèëêēe̊",
    i: "íìïîī",
    n: "ñ",
    o: "óòöôōo̊ø",
    r: "ṟř",
    s: "šś",
    u: "úùüûūů",
    tm: "™",
    "1": "₁",
    "2": "²",
    "3": "₃",
  };
  let alt = "";
  for (let i = 0; i < name.length; i++) {
    if (lstr.indexOf(name[i]) > -1) {
      let l = Object.keys(letters).find(c => letters[c].indexOf(name[i]) > -1);
      alt += l;
    } else {
      alt += name[i];
    }
  }
  return alt;
}

//[todo]
function addmethodfromsearch() {
  let mid = $("#methodnamelist li.selected").attr("id");
  let cid = $("#colllist").val();
  let mym = savemethods(mid, cid);
  if (!mym) {
    let li = $("#methodnamelist li.selected");
    let text = li.text();
    let ntext = "✓ "+text;
    li.text(ntext);
  }
  $("#addingdiv").addClass("hidden");
}

function choosecollfromsearch() {
  let mid = $("#methodnamelist li.selected").attr("id");
  let colls = availablecolls(mid);
  let html = colls.map(c => {
    return `<option value="${c.id}">${c.title}</option>`;
  }).join("");
  $("#colllist").html(html);
  $("#addingdiv").removeClass("hidden");
}

//mid: ccnum, cid: existing collection number
function savemethod(mid, cid) {
  let mym = mymethods.find(o => o.ccNum === mid);
  if (mym) {
    //already in mymethods
    mym.collections.push(cid);
  } else {
    //get method info
    let title = bigmethodinfo[mid].title;
    let o = {
      title: title,
      notes: [],
      ccNum: mid,
      collections: [],
      id: "m"+Date.now()
    };
    if (cid != "all-my-methods") o.collections.push(cid);
    mymethods.push(o);
  }
  let trtd = $("tr#"+cid + " td:nth-child(2)");
  let num = Number(trtd.text());
  num++;
  trtd.text(num.toString());
  
  savelocal();
  return mym;
}


// ***** collection functions *****

//only do this once at beginning, to preserve options (sorting etc.) for later
//will need to update collection stuff elsewhere
function buildcollections() {
  if (account) {
    let tbody = $("#collectionlist tbody");
    //add base collection
    let tr = `<tr id="all-my-methods"><td class="collection">All my methods</td><td>${mymethods.length}</td></tr>`;
    tbody.append(tr);
    //add others
    mycollections.forEach(c => {
      let num = mymethods.filter(m => m.collections.includes(c.id)).length;
      let row = `<tr id="${c.id}"><td class="collection">${c.title}</td><td>${num}</td><td><button class="remove">-</button></td></tr>`;
      tbody.append(row);
    });
  } else {
    //display log in option
    //do I even need this, it's probably a top level thing
  }
}

function removecoll(e) {
  let cid = $(e.currentTarget).parent().parent().attr("id");
  //probably want a dialog to confirm deletion
}

function viewcoll(cid) {
  let cmethods = cid === "all-my-methods" ? mymethods : mymethods.filter(m => m.collections.includes(cid));
  cmethods.sort(sortmethods);
  currentcollection = cid === "all-my-methods" ? allmymethods : mycollections.find(c => c.id === cid);
  
  $("#collectionpanel h3").text(currentcollection.title);
  $("#titleedit").val(currentcollection.title);
  let tbody = $("#collectionpanel tbody");
  tbody.contents().remove();
  
  cmethods.forEach(m => {
    let tr = `<tr id="${m.ccNum}"><td class="method">${m.title}</td><td class="edit"><button class="remove">-</button></td></tr>`;
    tbody.append(tr);
  });
  
  $("#collectionpanel .edit").hide();
  $("#collectionlist").hide();
  $("#collectionpanel").show();
}

function addemptycoll() {
  $("#newcollection").hide();
  $("#newcollpanel").removeClass("hidden");
}

function savenewcoll() {
  let title = $("#colltitle").val().trim();
  let err = checkcolltitle(title);
  if (err) {
    $("#newcollerror").text(err);
  } else {
    let coll = {
      title: title,
      id: "c"+Date.now()
    };
    mycollections.push(coll);
    let row = `<tr id="${coll.id}"><td class="collection">${title}</td><td>0</td><td><button class="remove">-</button></td></tr>`;
    $("#collectionlist tbody").append(row);
    
    cancelemptycoll();
  }
}

function cancelemptycoll() {
  $("#newcollection").show();
  $("#newcollpanel").addClass("hidden");
  $("#colltitle").val("");
  $("#newcollerror").text("");
}

//editing a collection

//start editing a collection
function editcollection() {
  //editing = true;
  $("#editcollection").hide();
  $("#collectionpanel .edit").show();
}

//{saving}
function savecolledits() {
  //title stuff
  let title = $("#titleedit").val().trim();
  let err = checkcolltitle(title, currentcollection.title);
  if (err) {
    $("#titleediterror").text(err);
  } else {
    //still need to do title stuff!
    currentcollection.title = title;
    $("#"+currentcollection.id + " td:first-child").text(title);
    //methods removed
    collectionedits.forEach(id => {
      let m = mymethods.find(o => o.id === id);
      let i = m.collections.indexOf(id);
      m.collections.splice(i, 1);
    });
    let num = $("#collectionpanel tbody tr").length;
    $("#"+currentcollection.id + " td:nth-child(2)").text(num.toString());
    //return to collection screen
    cancelcolledits();
    savelocal();
  }
}

function cancelcolledits() {
  editing = false;
  collectionedits = [];
  //viewcoll will hide the edit stuff but won't show currently hidden things
  $("#editcollection").show();
  viewcoll(currentcollection.id);
}

function removecollmethod(e) {
  editing = true;
  let parent = $(e.currentTarget).parent().parent();
  let mid = parent.attr("id");
  collectionedits.push(mid);
  parent.remove();
}

function colltitlekeyup(e) {
  let id = $(e.currentTarget).attr("id");
  let errp = id === "colltitle" ? "#newcollerror" : "#titleediterror";
  $(errp).text("");
  if (errp.startsWith("#t")) editing = true;
}

function checkcolltitle(title, edit) {
  let err;
  if (!title.length) {
    err = "title cannot be blank";
    return err;
  }
  let existing = mycollections.map(c => c.title);
  if (edit) {
    let i = existing.indexOf(edit);
    existing.splice(i, 1);
  }
  existing.push("All my methods");
  if (existing.includes(title)) {
    err = "collection title already in use";
  }
  return err;
}

function sortmethods(a,b) {
  if (sortby === "title") {
    return a.title.localeCompare(b.title);
  } else if (sortby === "added") {
    let an = Number(a.id.slice(1));
    let bn = Number(b.id.slice(1));
    return an-bn;
  }
}





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
    savelocal();
  }
  
}








// ***** method viewing functions *****

//given a method ccnum (as string with prefix "cc"), determine collections it could be added to
function availablecolls(ccnum) {
  let colls = [];
  let m = mymethods.find(o => o.ccNum === ccnum);
  if (m) {
    colls = mycollections.filter(c => !m.collections.includes(c.id));
  } else {
    colls.push(allmymethods);
    colls.push(...mycollections);
  }
  return colls;
}

//[todo]
function addmethodtocoll() {
  
}

function bluebellchange() {
  bluebell = $("#bluebell").val();
  drawmethod(methodobj);
}

//change method display
function toggledisplay() {
  let h;
  if ($("#lines").is(":checked")) {
    gridtype = "lines";
    $("#lineopts").show();
    h = "6em";
  } else {
    gridtype = "grid";
    h = "4em";
    $("#lineopts").hide();
  }
  buildrowarr();
  drawmethod(methodobj);
  $("#displayoptions").css("height", h);
}

//m is a string: "cc"+ccNum
function viewmethod(m, from) {
  //remove stuff from many divs
  $("#methodbackcontainer,#methodcollections,#methodinfobox,#methodcontainer,#methodnoteslist ul,#choosecoll").contents().remove();
  $("#addmethodnote").hide();
  //"from" a collection or a search
  let button = "backto"+from;
  $("#methodbackcontainer").append(`<button id="${button}" class="back">Back to ${from}</button>`);
  //what does "m" include? need to retrieve method info from somewhere
  let mobj = bigmethodobj[m]; //detailed info
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


function buildrowarr() {
  rowarr = [places.slice(0,stage).split("").map(bellnum)];
  let lead = buildlead(methodobj.pnFull);
  rowarr.push(...lead);
  if (gridtype === "lines") {
    let leads = 1;
    let prev = rowarr[rowarr.length-1];
    while (leads < methodobj.leadsInCourse) {
      let next = buildrows(prev, methodobj.pnFull);
      rowarr.push(...next);
      leads++;
      prev = rowarr[rowarr.length-1];
    }
  }
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



