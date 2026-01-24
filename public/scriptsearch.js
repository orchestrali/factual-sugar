const places = "1234567890ETABCD";
const methodcc = ["Bob", "Place", "Treble Bob", "Delight", "Surprise", "Treble Place", "Alliance", "Hybrid", "Principle"];
const symm = ["palindromic", "double", "rotational"];
const leadheads = ["Plain Bob", "Grandsire", "other"];

var numsearchrows = 1;
var queryobj;
var plaincoursesearch;
var searchresultsstring;
var searchresults;

$(function() {
  $("#search").on("change", ".field", searchfieldchange);
  $("#addrow").on("click", addsearchrow);
  $("#search").on("click", ".remove", removesearchrow);
  
  $("#submit").on("click", router);

  $("#container").on("click", "#download", downloadresults);
  $("table.sortable").on("click", "th", tableheadclick);
});

/*
NOTES
- display of pnFull is not right
- distinguish whether stage&pnFull are added only for plain course search
- need to figure out how to display matches in the plain course
I think I've addressed all of the above
*/


function addsearchrow() {
  let rownum = numsearchrows+1;
  //because of deletions, numsearchrows may not actually match the number of rows displayed...
  let row = `<div class="row" id="row${rownum}">
  <label for="field${rownum}">Search field:</label>
  <select id="field${rownum}" class="field">
    <option></option>`;
  let fields = ["Stage", "Class", "Name", "Symmetry", "Leadlength", "Place notation", "Leadheads", "Row in plain course"];
  fields.forEach(f => {
    row += `
    <option>${f}</option>`;
  });
  row += `
  </select>
  <span id="span${rownum}"></span>
  <button id="remove${rownum}" class="remove" type="button">-</button>`;
  $("#addrow").before(row);
  numsearchrows++;
}

function removesearchrow(e) {
  let id = e.currentTarget.id;
  //console.log(id);
  let num = id.slice(6);
  $("div#row"+num).remove();
}

function searchfieldchange(e) {
  let r = e.currentTarget.id.slice(5);
  $("#span"+r).contents().remove();
  let field = $(e.currentTarget).children("option:selected").text();
  let html = ``;
  switch (field) {
    case "Stage":
      for (let i = 4; i <= 12; i++) {
        let id = `row${r}stage${i}`;
        html += `<label for="${id}"><input type="checkbox" id="${id}" value="${i}" class="stage" />${i}</label>`;
      }
      break;
    case "Class": case "Symmetry":
      let arr = field === "Class" ? methodcc : symm;
      arr.forEach(c => {
        let smush = c.replace(/ /g, "-");
        let id = `row${r}`+smush;
        //value="${c}"
        html += `<label for="${id}"><input type="checkbox" id="${id}" class="${field.toLowerCase()}" value="${c}" />${c}</label>`;
      });
      break;
    case "Leadheads":
      let ids = ["plainbob", "grandsire", "other"];
      leadheads.forEach((c,i) => {
        let id = `row${r}`+ids[i];
        html += `<label for="${id}"><input type="checkbox" id="${id}" class="leadheads" value="${ids[i]}" />${c}</label>`;
      });
      break;
    case "Name": case "Place notation":
      let c = field === "Name" ? "name" : "pn";
      let id = field === "Name" ? "name"+r : "pn"+r;
      html += `<label for="${id}">search: <input type="text" id="${id}" class="${c}" /></label>`;
      break;
    case "Leadlength":
      let lid = "row"+r+"leadlength";
      html += `<label for="${lid}"><input type="number" id="${lid}" class="leadlength" /></label>`;
      break;
    case "Row in plain course":
      let rid = "row"+r+"bellrow";
      html += `<label for="${rid}">row or segment in plain course: <input type="text" id="${rid}" class="bellrowsearch" /></label>`;
  }
  
  $("#row"+r+" span").append(html);
}



// *** submit ***

function router() {
  plaincoursesearch = false;
  searchresults = [];
  searchresultsstring = "";
  let query = buildquery();
  queryobj = {};
  for (let key in query) {
    queryobj[key] = query[key];
  }
  console.log(query);
  $("#container,#results tbody,#results thead tr").contents().remove();
  if (query.fields.length) {
    if (plaincoursesearch) {
      ["stage","pnFull"].forEach(w => {
        if (!query.fields.includes(w)) query.fields += " "+w;
      });
    }
    $("#container").append("loading...");
    sendsearch(query);
  } else {
    $("#container").append("select at least one field to display!");
  }
}

function buildquery() {
  let fields = [];
  $('#fields input[type="checkbox"]').each((i,e) => {
    if ($(e).is(":checked")) fields.push($(e).attr("name"));
  });
  let q = buildsearchplain();
  
  
  let query = {fields: fields.join(" ")};
  for (let key in q) {
    let v = q[key];
    query[key] = v;
  }
  return query;
}

const fields = ["stage", "class", "name", "pn", "leadlength", "symmetry", "leadheads", "bellrow"];
function buildsearchplain() {
  let query = {};
  let arrays = {};
  fields.forEach(field => {
    let vals;

    switch (field) {
      case "stage":
        vals = [];
        $("input.stage").each((i,e) => {
          if ($(e).is(":checked")) {
            let v = $(e).val();
            vals.push(v);
          }
        });
        arrays.stage = vals;
        break;
      case "class": case "symmetry":
        vals = [];
        $("input."+field).each((i,e) => {
          if ($(e).is(":checked")) {
            let v = $(e).val();
            //console.log(v);
            if (!vals.includes(v)) vals.push(v);
          }
        });
        arrays[field] = vals;
        break;
      case "name": case "pn":
        if ($("."+field).length > 1) {
          //multiple name searches
        } else if ($("."+field).length) {
          let val = $("."+field).val();
          query[field] = val;
        }
        break;
      case "leadlength":
        vals = [];
        $(".leadlength").each((i,e) => {
          let v = $(e).val();
          if (v.length && v != "0") {
            vals.push(v);
          }
        });
        
        if (vals.length) {
          arrays.leadLength = vals;
        }
        break;
      case "leadheads":
        let checked = [];
        $(".leadheads").each((i,e) => {
          if ($(e).is(":checked")) {
            let v = $(e).val();
            if (!checked.includes(v)) checked.push(v);
          }
        });
        if ([1,2].includes(checked.length)) {
          query.leadheads = checked;
        }
        break;
      case "bellrow":
        let strs = [];
        $(".bellrowsearch").each((i,e) => {
          let v = $(e).val();
          if (v.length) {
            let a = v.split("");
            if (a.every(c => places.includes(c) || c === "x")) strs.push(v);
          }
        });
        if (strs.length) {
          plaincoursesearch = strs;
        }
    }
  });
  
  for (let key in arrays) {
    if (arrays[key].length === 1) {
      query[key] = arrays[key][0];
    } else if (arrays[key].length > 1) {
      query[key] = arrays[key].join(";");
    }
  }
  return query;
}



function sendsearch(query) {
  $.post({
    url: "/find/method",
    data: query,
    traditional: true,
    success: handleresults
  });
  /*
  
  var xhr = new XMLHttpRequest();
  xhr.open('POST', "/find/method", true);
  xhr.send(query);

  xhr.onload = function () {
    
    
    //$("#container").append("results loaded");
    let res = JSON.parse(xhr.responseText);
  }
  */
}

function handleresults(res) {
  console.log("loaded!");
  //doing this again to remove text "loading"
  $("#container").contents().remove();
  if (res.length) {
    //what if no methods match??
    //oh it'll just say 0
    //run filter here for plain course searches
    if (plaincoursesearch) {
      res = res.filter(checkmethodplaincourse);
      if (res.length) console.log(res[0]);
      queryobj.fields += " rowMatches";
    }
    let s = res.length === 1 ? "" : "s";
    let es = res.length === 1 ? "es" : "";
    $("#container").append(`<p>${res.length} method${s} match${es}</p>`);
    if (res.length) {
      searchresults = res; //so I can do stuff in the console
      $("#container").append(`<button type="button" id="download">Download results as csv</button>`);
      let cols = queryobj.fields.split(" ").length;
      searchresultsstring = queryobj.fields.split(" ").join(",");
      searchresultsstring += `
`;
      buildtable(res);
      for (let i = 1; i <= res.length; i++) {
        let tr = $("#results tbody tr:nth-child("+i+")");
        let row = [];
        for (let j = 1; j <= cols; j++) {
          let str = tr.children("td:nth-child("+j+")").text() || "";
          str = str.replace(/"/g, '\"');
          if (str.includes(",")) str = '"'+str+'"';
          row.push(str);
        }
        searchresultsstring += row.join(",");
        searchresultsstring += `
`;
      }
    }
  } else {
    console.log(res);
  }
}

var differentfields = ["classification", "huntBells", "stationaryBells", "symmetry", "huntPath", "pbOrder", "pnFull"];
function buildtable(res) {
  
  let cols = queryobj.fields.split(" ");
  $("#results thead tr").append(`<th>${cols.join("</th><th>")}</th>`);
  let table = ``;
  res.forEach(o => {
    table += `<tr>`;
    cols.forEach(k => {
      let s = "";
      if (k === "title") {
        let url = "https://complib.org/method/"+o.ccNum;
        s = `<a href="${url}" target="blank">${o[k]}</a>`;
      } else if (differentfields.includes(k)) {
        s = formatinfo(k, o[k]);
      } else if (k === "rowMatches") {
        let arr = [];
        o.matches.forEach(m => {
          arr.push(m.row + " (row "+m.number+")");
        });
        s = arr.join(", ");
      } else if (o[k]) {
        s = o[k];
      }
      table += `<td>${s}</td>`;
    });
    table += `</tr>`;
  });
  $("#results tbody").append(table);
}

function formatinfo(field, val) {
  let string = "";
  switch (field) {
    case "classification":
      let arr = [];
      for (let key in val) {
        if (val[key]) arr.push(key);
      }
      string = arr.join(", ");
      break;
    case "huntBells": case "stationaryBells": case "symmetry":
      string = val.join(", ");
      break;
    case "huntPath":
      string = val.join(",");
      break;
    case "pbOrder":
      if (val.length === 1) {
        string = val[0].join(",");
      } else if (val.length > 1) {
        string = "";
        val.forEach(a => {
          string += "["+a.join(",")+"]";
        });
      }
      break;
    case "pnFull":
      string = JSON.stringify(val);
      break;
  }
  return string;
}

function downloadresults() {
  const a = document.createElement('a');
  const blob = new Blob([searchresultsstring], {type: "text/plain"});
  a.href = URL.createObjectURL(blob);
  a.download = "method-search-results.csv";
  a.click();

  URL.revokeObjectURL(a.href);
}



// ******** functions for plain courses ********

//convert array of numbers to string
function rowstring(r) {
  return r.map(n => places[n-1]).join("");
}

//convert character to its bell number
function bellnum(c) {
  return places.indexOf(c)+1;
}

//row is an array of numbers
//pn is also an array, with numbers or empty
function applypn(row, pn) {
  let next = [];
  let dir = 1;
  for (let p = 1; p <= row.length; p++) {
    if (pn.includes(p)) {
      next.push(row[p-1]);
    } else {
      next.push(row[p-1+dir]);
      dir*=-1;
    }
  }
  return next;
}

function buildrows(start, pn) {
  let rows = [];
  let prev = start;
  for (let i = 0; i < pn.length; i++) {
    let next = applypn(prev, pn[i]);
    rows.push(next);
    prev = next;
  }
  return rows;
}

function buildcourse(pn, stage) {
  let start = places.slice(0, stage).split("").map(bellnum);
  let rows = [];
  let last = start;
  let laststr = rowstring(last);
  do {
    let lead = buildrows(last, pn);
    rows.push(...lead);
    last = rows[rows.length-1];
    laststr = rowstring(last);
  } while (!places.includes(laststr));

  return rows;
}


function checkmethodplaincourse(m) {
  let pn = m.pnFull.map(e => {return e === "x" ? [] : e});
  let course = buildcourse(pn, m.stage);
  let rows = course.map(r => rowstring(r));
  let matches = [];
  //will be an OR search if there are multiple patterns
  plaincoursesearch.forEach(p => {
    let mm = testpattern(rows, p);
    mm.forEach(r => {
      let o = {
        row: r,
        number: rows.indexOf(r)+1
      };
      matches.push(o);
    });
  });
  if (matches.length) m.matches = matches;
  return matches.length > 0;
}

function testpattern(rows, pattern) {
  if (!pattern.includes("x")) {
    return rows.filter(r => r.includes(pattern));
  }
  let test = new RegExp(pattern.replace(/x/g, "\\w"));
  return rows.filter(r => test.test(r));
}

