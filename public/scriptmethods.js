const places = "1234567890ETABCD";

//need some holder for method titles
var methodnames;
//separate holder for detailed method info?
var bigmethodobj;
// holder for record of loaded method stages
var stagesloaded = [];
//holder for svg stuff
var svg;
//display option for methods: grid, lines
var gridtype = "grid";
//save bluebell choices?
//separate for each stage?
var bluebellprefs = {};
var bluebell = "auto";

//holder for detailed info about mymethods
var smallmethodobj = {};
//hmmm possibly only establish this when logged in?
var allmymethods = {title: "All my methods", id: "all-my-methods", position: 1};
//email?
var account;
//methods need: title, notes (array), collections (array of ids), id (m+date added), ccNum
var mymethods;
//collections are just title and id
//adding: position (in list of collections), sort (within collection), notes
var mycollections;

//possible: collectionlist, collectionpanel, methodpanel, addmethodscreen
var currentscreen = "collectionlist";
//method object from mymethods
var currentmethod;
var currentcollection;
var currentthing;
var currentnote;
//detailed info of method being viewed
//needs to have: pnFull, leadsInCourse, leadLength
var methodobj;
var stage;
var rowarr;
//methods within a collection; options "title" or "added"
var sortby = "title";
//for editing a collection or moving collections in the list
var editing;
var noteediting;
//searching methods
var searchparams = {};
var searchval = "";
//collection to be deleted
var targetcoll;

var collview = "list";

//{saving} - parts where I need to save user input
//[todo] - stuff to write or edit!


$(function() {
  $(".loadmethods,#overlay,#addmethods,.dialog").hide();
  console.log($("body > h4").text().length);
  setupuser();
  $("#methodcontainer").svg({onLoad: (o) => {
    svg = o;
    $("svg").remove();
  }});

  //big button clicks
  $("#abandon").on("click", homeview);
  $(".viewcollections").on("click", homeclick);
  $(".stayonpage,.closeabout").on("click", stayonpage);
  $(".loadmethods").on("click", showloadmethods);
  $("#aboutbutton").on("click", () => $("#overlay,#about").show());

  //note or collection
  $("#confirmdelete").on("click", confirmdelete);

  //method search functions
  $("#addmethods").on("click", searchmethods);
  $("#methodclass,#methodstage").on("change", buildmethodlist);
  $("#methodsearch").on("keyup", methodkeyup);
  $("#methodnamelist").on("click", "li", (e) => {
    $("li.selected").removeClass("selected");
    $(e.currentTarget).addClass("selected");
    $("#addingdiv").addClass("hidden");
    $("#methodbuttons").show();
  });
  $("#viewmethod").on("click", viewfromsearch);
  $("#addmethod").on("click", choosecollfromsearch);
  $("#saveadd").on("click", addmethodfromsearch);

  //method functions
  $("#displayopts").on("change", toggledisplay);
  $("#bluebell").on("change", bluebellchange);
  $("#collectionpanel").on("click", "td.method", methodclick);
  $("#methodbackcontainer").on("click", "button", backfrommethod);
  $("#methodpanel > h4").on("click", dropdownclick); //.arrow clicks should bubble?
  $("#savemethod").on("click", addmethodtocoll);

  //note functions
  $("#addnote").on("click", editnote);
  $("#savenote").on("click", savenote);
  $("#noteslist").on("click", "li", viewnoteclick);
  $("#noteback").on("click", backfromnote);
  $("#editnote").on("click", editnote);
  $("#cancelnote").on("click", canceleditnote);
  $("#notetitle").on("keyup", notetitlekeyup);
  $("#deletenote").on("click", clickdelete);

  //collection list functions
  $("#collectionlist").on("click", "td.collection", collclick);
  $("#colltitle,#titleedit").on("keyup", colltitlekeyup);
  $("#newcollection").on("click", () => $("#newcollpanel").removeClass("hidden"));
  $("#savecoll").on("click", savenewcoll);
  $("#collectionlist").on("click", ".remove", clickdelete); //not functional yet
  $("#collectionlist").on("change", ".cposition", movecoll);
  $("#collectionlist").on("click", ".movecoll", bumpcoll);
  $("#collectionlist").on("click", ".cancelcollmove", cancelcollmove);
  //single collection functions
  $("#editcollection").on("click", editcollection);
  $("#cancelcolledits").on("click", cancelcolledits);
  $("#collectionpanel").on("click", ".remove", removecollmethod);
  $("#savecolledits").on("click", savecolledits);
  $('input[name="sort"]').on("change", changecollsort);
  $("#toggleview").on("click", togglecollview);
  
});


function setuppage() {
  setupuser();
  //show info if new user?
}

//show dialog to choose stages of methods to load
function showloadmethods() {
  $("#overlay").show();
  let opts = `Method stages to load: `;
  for (let i = 3; i <= 16; i++) {
    let check = [5,6,7,8].includes(i) ? "checked" : "";
    let s = i.toString();
    if (!stagesloaded.includes(i)) {
      opts += `<label><input type="checkbox" class="stage" value="${s}" ${check}/>${s}</label>`;
    }
  }
  opts += `<button id="fetchmethods">Go</button>
  <button id="cancelfetch">Cancel</button></p>`;
  $("#loadingcontainer").append(`<div id="loadstages"><h3>Load methods</h3></div>`);
  
  $("#loadstages").append(opts);
  $("#fetchmethods").on("click", loadmethodsclick);
  $("#cancelfetch").on("click", cancelmethodload);
}

function loadmethodsclick() {
  let stages = [];
  $("input.stage:checked").each((i,e) => stages.push($(e).val()));
  $("#loadstages").remove();
  $("#loadingcontainer").append(`<p id="temp">Loading methods...</p>`);

  getmethods(stages.join(";"));
}

function cancelmethodload() {
  $("#loadstages").remove();
  $("#overlay").hide();
}

//old function where I always started by fetching methods
function setupgetmethods() {
  $("#screens").append(`<p id="temp">Loading methods...</p>`);
  let o = {
    fields: "title stage class ccNum pn pnFull leadsInCourse leadHeadCode",
    stage: "4;5;6;7;8;9;10;11;12"
  };

  $.post("/find/method", o, (mm) => {
    console.log("methods retrieved");
    
    bigmethodobj = {};
    methodnames = [{stage: 4, classes: []},{stage: 5, classes: []},{stage: 6, classes: []},{stage: 7, classes: []},{stage: 8, classes: []}, {stage: 9, classes: []}, {stage: 10, classes: []}, {stage: 11, classes: []}, {stage: 12, classes: []}];
    mm.forEach(m => {
      let small = {title: m.title, cc: "cc"+m.ccNum};
      m.leadLength = m.pnFull.length;
      let stageo = methodnames[m.stage-4];
      let co = stageo.classes.find(obj => obj.class === m.class);
      if (co) {
        co.methods.push(small);
      } else {
        stageo.classes.push({class: m.class, methods: [small]});
      }
      bigmethodobj[small.cc] = m;
    });
    
    
    
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
    if (localStorage.getItem("smallmethodobj")) {
      smallmethodobj = JSON.parse(localStorage.getItem("smallmethodobj"));
    }
    tempcleanup();
  } else {
    account = "accountname";
    mymethods = [];
    mycollections = [];
  }
  buildcollections();
  $(".loadmethods").show();
}

//
function getmethods(stages) {
  let o = {
    fields: "title stage class ccNum pn pnFull leadsInCourse leadHeadCode",
    stage: stages
  };
  //prevent stuff while searching
  //doing this with the overlay

  $.post("/find/method", o, (mm) => {
    console.log("methods retrieved");
    if (stagesloaded.length === 0) {
      bigmethodobj = {};
      methodnames = [];
    }
    let nstages = stages.split(";").map(n => Number(n));
    nstages.forEach(n => {
      methodnames.push({stage: n, classes: []});
      stagesloaded.push(n);
    });
    stagesloaded.sort((a,b) => a-b);
    
    mm.forEach(m => {
      let small = {title: m.title, cc: "cc"+m.ccNum};
      m.leadLength = m.pnFull.length;
      let stageo = methodnames.find(o => o.stage === m.stage);
      let co = stageo.classes.find(obj => obj.class === m.class);
      if (co) {
        co.methods.push(small);
      } else {
        stageo.classes.push({class: m.class, methods: [small]});
      }
      bigmethodobj[small.cc] = m;
    });

    $("#methodstage option").prop("disabled", true);
    stagesloaded.forEach(n => {
      let child = n-2;
      let opt = $("#methodstage option:nth-child("+child+")");
      opt.prop("disabled", false);
      if (searchparams.stage && n === searchparams.stage) opt.prop("selected", true);
      if (!searchparams.stage) {
        opt.prop("selected", true);
        searchparams.stage = n;
      }
    });
    buildmethodlist();
    $("#temp").remove();
    
    if (stagesloaded.length < 14) $(".loadmethods").show();
    $("#addmethods").show();
    $("#overlay").hide();
  });
}

//changes to how localstorage items need to be structured
function tempcleanup() {
  //smallmethodobj = {};
  mymethods.forEach(m => {
    let i = m.collections.indexOf("all-my-methods");
    if (i > -1) {
      m.collections.splice(i,1);
    }
    m.notes.forEach(n => {
      if (typeof n.id === "number") {
        n.id = "mn"+n.id;
      } else if (n.id.length > 15) {
        n.id = n.id.slice(-15);
      }
      
    });
    //let obj = bigmethodobj[m.ccNum];
    //smallmethodobj[m.ccNum] = obj;
  });
  if (mycollections.length && !mycollections[0].position) {
    mycollections.forEach((c,i) => c.position = i+2);
  }
  savelocal();
}

function savelocal() {
  localStorage.setItem("account", account);
  localStorage.setItem("mymethods", JSON.stringify(mymethods));
  localStorage.setItem("mycollections", JSON.stringify(mycollections));
  //this one might stay in local storage? or when retrieving user data, get detailed info about just the methods in their collections
  localStorage.setItem("smallmethodobj", JSON.stringify(smallmethodobj));
}



// ***** moving between screens?? *****

function changescreen(no) {
  $(".screen").hide(); //,#alert
  currentnote = null;
  if (no) $(".notescreen").hide();
  //cancel things??
  $("#"+currentscreen).show();
}

//[todo]
function cancelthings() {
  //collection edits (may be handling this already)
  //new (empty) collection
  //collection move (within list)
  //new note
  //editing note
  //loading methods (may already be done)
  //adding method to collection
}

//search screen
function searchmethods() {
  if (!editing) { //if I'm not rearranging the collection list
    currentscreen = "addmethodscreen";
    $("#collectionlist").hide();
    $("#addmethodscreen").show();
  }
}

//attempt to return to my collections
function homeclick() {
  if (editing || noteediting) {
    $("#alert,#overlay").show();
  } else {
    homeview();
  }
}

//return to my collections
function homeview() {
  $("#alert,#overlay").hide();
  currentscreen = "collectionlist";
  
  //reset stuff
  editing = false;
  noteediting = false;
  collectionedits = [];
  currentmethod = null;
  currentcollection = null;
  currentthing = null;
  currentnote = null;
  changescreen(true);
}

function backfrommethod(e) {
  if (!noteediting) {
    let what = $(e.currentTarget).attr("id").slice(6);
    currentscreen = what === "collection" ? "collectionpanel" : "addmethodscreen";
    currentmethod = null;
    currentnote = null;
    currentthing = currentcollection;
    $(".notescreen").hide();
    if (currentthing) {
      $("#editcollection").show();
      buildnoteslist(currentthing);
    }
    changescreen(); //what === "search" doesn't matter because I'm hiding screens anyway
  }
}

//from within a collection
function methodclick(e) {
  let cc = $(e.currentTarget).parent().attr("id");
  let from = "collection";
  
  if (smallmethodobj[cc] && !editing && !noteediting) {
    viewmethod(cc, from);
  }
}

//view method via search
function viewfromsearch(e) {
  let id = $("#methodnamelist li.selected").attr("id");
  let from = "search";
  
  if (id.startsWith("cc")) {
    viewmethod(id, from);
  }
}

//view collection from list
function collclick(e) {
  let cid = $(e.currentTarget).parent().attr("id");
  if (!editing) { //can't view collection when trying to rearrange the list
    viewcoll(cid);
  }
}


function stayonpage() {
  targetcoll = null;
  $(".dialog,#overlay").hide();
}

//use for collection and note
function clickdelete(e) {
  let elem = $(e.currentTarget);
  let id = elem.attr("id");
  let text = id === "deletenote" ? "note" : "collection";
  $("#deletedialog span").text(text);
  //set target to remove
  if (text != "note") {
    let cid = elem.parent().parent().attr("id");
    targetcoll = mycollections.find(o => o.id === cid);
  }
  $("#overlay,#deletedialog").show();
}

function confirmdelete() {
  if (targetcoll) {
    removecoll();
  } else if (currentnote) {
    let i = currentthing.notes.findIndex(n => n.id === currentnote.id);
    if (i > -1) {
      currentthing.notes.splice(i, 1);
      currentnote = null;
      savelocal();
      $(".notescreen").hide();
      buildnoteslist(currentthing);
    }
  }
  $("#overlay,#deletedialog").hide();
}




// ***** method search functions *****

const stagenames = ["Singles", "Minimus", "Doubles", "Minor", "Triples", "Major", "Caters", "Royal", "Cinques", "Maximus", "Sextuples", "Fourteen", "Septuples", "Sixteen"];
//build method title list
function buildmethodlist() {
  $("#methodsearch").val("").prop("disabled", false);
  searchval = "";
  $("#methodnamelist ul").contents().remove();
  let methodset = searchparamstuff(); //get this based on search terms
  let stagename = stagenames[searchparams.stage-3];
  if (!methodset) {
    $("#methodnamelist ul").append(`<li>problem</li>`);
  } else {
    if (methodset.length === 0) {
      $("#methodnamelist ul").append(`<li>No ${searchparams.class} ${stagename} methods exist!</li>`);
      $("#methodsearch").prop("disabled", true);
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
}

function searchparamstuff() {
  searchparams.stage = Number($("#methodstage option:checked").val());
  searchparams.class = $("#methodclass option:checked").text();
  let stageo = methodnames.find(o => o.stage === searchparams.stage);
  if (!stageo) {
    //error
    //[todo]
    console.log("error with search stage?");
    console.log(searchparams);
    console.log(stagesloaded);
    return null;
  } else {
    let classo = stageo.classes.find(o => o.class === searchparams.class);
    if (classo) {
      return classo.methods.sort((a,b) => a.title.localeCompare(b.title));
    } else {
      return [];
    }
  }
  
}

//
function methodkeyup(e) {
  let search = $("#methodsearch").val().trim().toLowerCase();
  if (search != searchval) {
    filtermethodlist(search);
    searchval = search;
  }
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
  let lstr = "áàäâāåčçéèëêēe̊íìïîīñóòöôōo̊øṟřšśúùüûūůæ₃₁²™′’";
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
    "'": "′’"
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
  let mym = savemethod(mid, cid); //[mym]
  if (mym) {
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

//save a method to a collection
//mid: ccnum, cid: existing collection number
function savemethod(mid, cid) {
  console.log("saving method");
  console.log(mid, cid);
  let mym = mymethods.find(o => o.ccNum === mid);
  let o;
  let trs = [cid];
  if (mym) {
    //already in mymethods - cid can't be all-my-methods
    //prevent duplicates?
    if (!mym.collections.includes(cid)) mym.collections.push(cid);
  } else {
    //get method info
    let title = bigmethodobj[mid].title;
    o = {
      title: title,
      notes: [],
      ccNum: mid,
      collections: [],
      id: "m"+Date.now()
    };
    if (cid != "all-my-methods") {
      o.collections.push(cid);
      trs.push("all-my-methods");
    }
    mymethods.push(o);
    smallmethodobj[mid] = bigmethodobj[mid];
  }
  trs.forEach(tr => {
    let trtd = $("tr#"+tr + " td.count");
    let num = Number(trtd.text());
    num++;
    trtd.text(num.toString());
  });
  
  savelocal();
  return o; //object from mymethods if it wasn't already there
}


// ***** collection list functions *****

//saving collection sort in mycollections
//editing "All my methods" will prompt rebuild
function buildcollections() {
  if (account) {
    let tbody = $("#collectionlist tbody");
    tbody.contents().remove();

    let move = `<select class="cposition">`;
    for (let i = 1; i <= mycollections.length+1; i++) {
      move += `<option>${i}</option>`;
    }
    move += `</select>`;
    
    //add collections in saved position order
    for (let i = 1; i <= mycollections.length+1; i++) {
      let c = mycollections.find(o => o.position === i);
      if (!c) c = allmymethods;
      let num = c.id === "all-my-methods" ? mymethods.length : mymethods.filter(m => m.collections.includes(c.id)).length;
      let last = c.id === "all-my-methods" ? "" : `<td><button class="remove">-</button></td>`;
      let row = `<tr id="${c.id}"><td class="collection">${c.title}</td><td class="count">${num}</td><td>${move}</td>${last}</tr>`;
      tbody.append(row);
      $("#collectionlist tr:last-child .cposition option:nth-child("+i+")").prop("selected", true);
    }
  } else {
    //display log in option
    //do I even need this, it's probably a top level thing
  }
}

//cancel moving a collection within the collection list
function cancelcollmove(e) {
  editing = false;
  let i = $(".cancelcollmove").parent().parent().index()+1;
  $("#collectionlist tbody tr:nth-child("+i+") option:nth-child("+i+")").prop("selected", true);
  $(".movecoll,.cancelcollmove").remove();
  $(".cposition").prop("disabled", false);
}

//change collection position dropdown selection
function movecoll(e) {
  editing = true;
  $(e.currentTarget).after(`<button class="movecoll">Go</button><button class="cancelcollmove">Cancel</button>`);
  $(".cposition").prop("disabled", true);
}

//actually move collection to a new position
//update other collection positions as needed
function bumpcoll(e) {
  let npos = Number($(e.currentTarget).prevAll("select").children("option:checked").text());
  let oldpos = $(e.currentTarget).parent().parent().index()+1;
  //console.log(npos);
  
  //direction to move other rows
  let dir = oldpos > npos ? 1 : -1;
  let start = Math.min(npos, oldpos);
  let end = Math.max(npos, oldpos);
  for (let i = start; i <= end; i++) {
    let c = mycollections.find(o => o.position === i);
    if (!c) c = allmymethods;
    let movedpos = i+dir;
    if (i === oldpos) {
      movedpos = npos;
      let tr = $("#collectionlist tbody tr:nth-child("+i+")").detach();
      let j = npos-1;
      $("#collectionlist tbody tr:nth-child("+j+")").after(tr);
      c.position = npos;
    } else {
      c.position += dir;
    }
  }
  $("#collectionlist tbody tr").each((i,e) => {
    let n = i+1;
    $(e).find(".cposition option:nth-child("+n+")").prop("selected", true);
  });
  $(".movecoll,.cancelcollmove").remove();
  $(".cposition").prop("disabled", false);
  editing = false;
}

//[todo]
function removecoll() {
  let cid = targetcoll.id;
  //remove methods from collection - I suppose this is just tidy
  mymethods.forEach(m => {
    let i = m.collections.indexOf(cid);
    if (i > -1) m.collections.splice(i, 1);
  });
  //remove collection
  let i = mycollections.findIndex(o => o.id === cid);
  mycollections.splice(i, 1);
  //
  savelocal();
  $("#"+cid).remove();
  targetcoll = null;
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



// ***** viewing/editing a collection *****

function viewcoll(cid) {
  currentscreen = "collectionpanel";
  $("#gridcontainer").hide();
  $("#collectionpanel table").show();
  let all = cid === "all-my-methods";
  let cmethods = all ? mymethods : mymethods.filter(m => m.collections.includes(cid));
  currentcollection = all ? allmymethods : mycollections.find(c => c.id === cid);
  currentthing = currentcollection;
  sortby = currentcollection.sort || "title";
  $(`#collsort input[value="${sortby}"]`).prop("checked", true);
  cmethods.sort(sortmethods);
  if (all) $("#toggleview").hide();
  
  $("#collectionpanel h3").text(currentcollection.title);
  $("#titleedit").val(currentcollection.title);
  let tbody = $("#collectionpanel tbody");
  tbody.contents().remove();
  
  cmethods.forEach(m => {
    let tr = `<tr id="${m.ccNum}"><td class="method">${m.title}</td><td class="edit"><button class="remove">-</button></td></tr>`;
    tbody.append(tr);
  });
  $(".notescreen").hide();
  buildnoteslist(currentthing);
  $("#collectionpanel .edit").hide();
  changescreen();
}


function togglecollview() {
  let prev = collview;
  let text = collview === "grid" ? "View as grids" : "View as list";
  $("#toggleview").text(text);
  collview = prev === "grid" ? "list" : "grid";
  if (collview === "grid") {
    $("#editcollection,#collsort,#collectionpanel table").hide();
    $("#gridcontainer").contents().remove();
    let cmethods = mymethods.filter(m => m.collections.includes(cid));
    let heights = [];
    cmethods.forEach(m => {
      let mobj = smallmethodobj[m.ccNum];
      let rows = buildrowarr(mobj, "grid");
      drawmethod(mobj, "grid", rows, true);
      heights.push(Number($("svg:last-child").attr("height")));
    });
    console.log(heights);
    $("#gridcontainer").show();
  } else {
    $("#gridcontainer").hide();
    $("#editcollection,#collsort,#collectionpanel table").show();
    
  }
}

//start editing a collection
function editcollection() {
  //editing = true;
  $("#editcollection,#collsort,button.change,#toggleview").hide();
  //can't change title of "All my methods"
  $("#titleedit").prop("disabled", currentcollection.id === "all-my-methods");
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
    //more title stuff!
    currentcollection.title = title;
    $("#"+currentcollection.id + " td.collection").text(title);
    //methods removed
    collectionedits.forEach(id => {
      let j = mymethods.findIndex(o => o.id === id);
      if (currentcollection.id === "all-my-methods") {
        mymethods.splice(j,1);
      } else {
        let m = mymethods[j];
        let i = m.collections.indexOf(id);
        m.collections.splice(i, 1);
      }
      
    });
    //update method counts in collection list
    if (currentcollection.id === "all-my-methods" && collectionedits.length) {
      //probably need to just rebuild the collection list
      buildcollections();
    } else if (collectionedits.length) {
      let num = $("#collectionpanel tbody tr").length;
      //another way to identify this column??
      $("#"+currentcollection.id + " td.count").text(num.toString());
    }
    savelocal();
    //return to collection screen
    cancelcolledits();
  }
}

function cancelcolledits() {
  editing = false;
  collectionedits = [];
  //viewcoll will hide the edit stuff but won't show currently hidden things
  $("#editcollection,#collsort,button.change,#toggleview").show();
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

function changecollsort(e) {
  let sort = $(e.currentTarget).val();
  //console.log(sort);
  currentcollection.sort = sort;
  viewcoll(currentcollection.id);
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





// ***** note functions *****

function viewnoteclick(e) {
  let id = $(e.currentTarget).attr("id");
  let note = currentthing.notes.find(o => o.id === id);
  viewnote(note);
}

function viewnote(note) {
  $("#noteviewer h4").html(note.title);
  $("#notecontainer").remove();
  $("#noteviewer").append(`<pre id="notecontainer">${note.contents}</pre>`);
  currentnote = note;
  $(".notescreen").hide();
  $("#noteviewer").show();
}

function backfromnote() {
  currentnote = null;
  $("#noteviewer").hide();
  $("#noteslist").show();
}

var months = ["Jan","Feb","Mar","Apr","May", "Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
//edit or add new
function editnote() {
  noteediting = true;
  let title, text;
  if (currentnote) {
    title = currentnote.title;
    text = currentnote.contents;
  } else {
    let today = new Date();
    let date = [today.getDate(), months[today.getMonth()], today.getFullYear()];
    title = date.join(" ");
    text = "";
  }
  if (!currentmethod) {
    $("#editcollection").hide();
  }
  $("#notetitle").val(title);
  $("#note").val(text);
  $(".notescreen").hide();
  $("#noteeditor").show();
}

//needs to handle edits AND new notes
//actually cancel; pretty easy
function canceleditnote() {
  noteediting = false;
  if (!currentmethod) {
    $("#editcollection").show();
  }
  $("#noteeditor").hide();
  let show = currentnote ? "#noteviewer" : "#noteslist";
  $(show).show();
}

//[todo]
function notedelete() {
  
}


function notetitlekeyup(e) {
  $("#notetitleerror").text("");
  let title = $(e.currentTarget).val().trim();
  let existing = currentthing.notes.map(n => n.title);
  if (currentnote) {
    let i = currentthing.notes.findIndex(n => n.id === currentnote.id);
    existing.splice(i, 1);
  }
  if (existing.includes(title)) {
    $("#notetitleerror").text("note title already in use");
  }
}

//{saving}
function savenote() {
  let text = $("#note").val();
  let err = $("#notetitleerror").text();
  if (text.length && !err.length) {
    let type = currentmethod ? "m" : "c";
    let id = type + "n" + Date.now();
    let o = {
      title: $("#notetitle").val().trim(),
      contents: text
    };
    
    if (o.title.length === 0) o.title = "note "+(currentthing.notes.length+1);
    if (currentnote) {
      o.id = currentnote.id;
      let i = currentthing.notes.findIndex(n => n.id === currentnote.id);
      currentthing.notes.splice(i, 1, o);
      $("#"+o.id).html(o.title);
    } else {
      o.id = id;
      currentthing.notes.push(o);
      $("#noteslist ul").append(`<li id="${o.id}">${o.title}</li>`);
    }

    savelocal();
    if (!currentmethod) {
      $("#editcollection").show();
    }
    noteediting = false;
    viewnote(o);
  } else {
    //empty note or problem with title
    //[todo]
  }
}

//obj is currentthing
function buildnoteslist(obj) {
  $("#noteslist li").remove();
  if (!obj.notes) obj.notes = [];
  let notes = obj.notes;
  //add the notes...
  notes.forEach(o => {
    $("#noteslist ul").append(`<li id="${o.id}">${o.title}</li>`);
  });
  $("#noteslist").show();
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
//click from method view
function addmethodtocoll() {
  let mid = "cc"+methodobj.ccNum;
  let cid = $("#choosecoll").val();
  let coll = cid === "all-my-methods" ? allmymethods : mycollections.find(o => o.id === cid);
  let mym = savemethod(mid, cid); //[mym]
  $(`#choosecoll option[value="${cid}"]`).remove();
  let li = `<li>${coll.title}</li>`;
  if (mym) { //method was not already in mymethods
    currentmethod = mym;
    currentthing = currentmethod;
    buildnoteslist(currentthing);
    if (cid != "all-my-methods") $(`#choosecoll option[value="all-my-methods"]`).remove();
    $("#methodcollections").append(`<ul></ul>`);
    $("#methodpanel > h4:first-of-type").show();
    let li = $("#methodnamelist li.selected");
    let text = li.text();
    let ntext = "✓ "+text;
    li.text(ntext);
  }
  
  $("#methodcollections ul").append(li);
}

function bluebellchange() {
  bluebell = $("#bluebell").val();
  drawmethod(methodobj, gridtype, rowarr);
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
  rowarr = buildrowarr(methodobj, gridtype);
  drawmethod(methodobj, gridtype, rowarr);
  $("#displayoptions").css("height", h);
}

//m is a string: "cc"+ccNum
function viewmethod(m, from) {
  currentscreen = "methodpanel";
  //remove stuff from many divs
  $("#methodbackcontainer,#methodcollections,#methodinfobox,#methodcontainer,#choosecoll").contents().remove();
  $(".notescreen").hide();
  //"from" a collection or a search
  let button = "backto"+from;
  $("#methodbackcontainer").append(`<button id="${button}" class="back">Back to ${from}</button>`);
  //what does "m" include? need to retrieve method info from somewhere
  let mobj = bigmethodobj ? bigmethodobj[m] : smallmethodobj[m]; //detailed info
  stage = mobj.stage;
  methodobj = mobj;
  $("#methodtitle").text(mobj.title);
  $("#methodinfobox").append(`<ul></ul>`);
  let info = $("#methodinfobox ul");
  info.append(`<li>Place notation: ${mobj.pn}</li>`);
  
  rowarr = buildrowarr(methodobj, gridtype);
  let lh = rowstring(rowarr[mobj.leadLength]);
  if (!mobj.huntBells) {
    mobj.huntBells = [];
    for (let i = 0; i < stage; i++) {
      if (lh[i] === places[i]) mobj.huntBells.push(i+1);
    }
  }
  if (mobj.leadHeadCode) {
    lh += " (code "+mobj.leadHeadCode+")";
  }
  info.append(`<li>Leadhead: ${lh}</li>`);
  let link = `<a href="https://complib.org/method/${m.slice(2)}" target="blank">View on complib.org</a>`;
  info.append(`<li>${link}</li>`);
  //need to save bluebell choice and reapply it
  $("#bluebell").html(bluebellopts(stage));
  $('#bluebell').val(bluebell);
  //console.log("drawing method??");
  //this function will take view prefs into account
  drawmethod(mobj, gridtype, rowarr);
  
  if (account) {
    currentmethod = mymethods.find(o => o.title === mobj.title);
    if (currentmethod) {
      currentthing = currentmethod;
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
      let possible = availablecolls(m);
      if (from === "search" && possible.length) {
        possible.forEach(c => {
          $("#choosecoll").append(`<option value="${c.id}">${c.title}</option>`);
        });
        $("#addtocollection").show();
      } else {
        $("#addtocollection").hide();
      }
      //display any notes
      buildnoteslist(currentthing);
      //display add note button
      //$("#addmethodnote").show();
    } else {
      $("#methodpanel > h4:first-of-type").hide();
      $("#choosecoll").append(`<option value="all-my-methods">All my methods</option>`);
      mycollections.forEach(c => {
        $("#choosecoll").append(`<option value="${c.id}">${c.title}</option>`);
      });
      $("#addtocollection").show();
    }
    //option to add method to a collection
  }
  changescreen();
}

function dropdownclick(e) {
  let arrow = $(e.currentTarget).hasClass("arrow") ? $(e.currentTarget) : $(e.currentTarget).children(".arrow");
  dropdown(arrow);
}

//info panels when viewing a method
function dropdown(arrow) {
  arrow.toggleClass("rotate");
  let which = arrow.parent().next();
  let id = which.attr("id");
  if (arrow.hasClass("rotate")) {
    let h;
    switch (id) {
      case "displayoptions":
        h = gridtype === "grid" ? "4em" : "6em";
        break;
      case "methodcollections": case "methodinfobox":
        let n = which.find("li").length;
        h = (n+3) + "em";
        break;
      
        //might need to copy methodcollections when I'm showing more properties
        //also need to deal with/stop wrapping
        //h = "4em";
        //break;
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

//vars needed: 
//m needs to have: huntBells, leadLength, stage
//actually do I need m? wait currentmethod is for the object in my collection
function drawmethod(m, gridtype, rowarr, target) {
  let topparent = target ? "#gridcontainer" : "#methodcontainer";
  let stage = m.stage;
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
  let height = target ? 40 : 20;
  height += 20*rowarr.length;
  
    //gridtype === "grid" ? m.leadLength*20 : m.leadLength*m.leadsInCourse*20;
  let grid = svg.svg($(topparent), null, null, width, height, {class: "grid", xmlns: "http://www.w3.org/2000/svg", "xmlns:xlink": "http://www.w3.org/1999/xlink"});
  let boxgroup = svg.group(grid, {style: "fill: #eeeeee"});
  let numgroup = svg.group(grid, {style: "font-family: Arial; font-size: 14pt"});
  let huntgroup = svg.group(grid, {style: "stroke: red; stroke-width: 1; fill: none;"});
  let workgroup = svg.group(grid, {style: "stroke: blue; stroke-width: 2; fill: none;"});
  let workgreen = svg.group(grid, {style: "stroke: green; stroke-width: 2; fill: none;"});
  let linegroup = svg.group(grid, {style: "stroke: black; stroke-width: 1; fill: none;"});

  let topy = 10;
  //y increment between leadends
  let liney = m.leadLength*20;
  if (target) {
    topy += 20;
    liney += 20;
    svg.text(numgroup, width/2, 20, m.title, {style: "font-size: 12px; font-weight: bold; text-anchor: middle;"});
  }
  let pbs = [];
  
  for (let b = 1; b <= stage; b++) {
    let hunt;
    let color;
    if (gridtype === "lines" && b%2 === 0) {
      let x = -6+16*(b-1);
      svg.rect(boxgroup, x, topy, 16, height-40);
    }
    let parent;
    if (m.huntBells && m.huntBells.includes(b)) {
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
      let path = buildsvgpath(pp, topy);
      svg.path(parent, path);
      if (!hunt && gridtype === "lines") {
        for (let y = topy; y < height; y += liney) {
          let rownum = (y-topy)/20;
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
function buildsvgpath(pp, topy) {
  let current = pp[0];
  let path = ["M", -6+16*current, topy].join(" ");
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


function buildrowarr(methodobj, gridtype) {
  let rowarr = [places.slice(0,methodobj.stage).split("").map(bellnum)];
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
  return rowarr;
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



