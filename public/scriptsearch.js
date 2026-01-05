const places = "1234567890ETABCD";
const methodcc = ["Bob", "Place", "Treble Bob", "Delight", "Surprise", "Treble Place", "Alliance", "Hybrid", "Principle"];
const symm = ["palindromic", "double", "rotational"];
const leadheads = ["Plain Bob", "Grandsire", "other"];

var numsearchrows = 1;
var queryobj;

$(function() {
  $("#search").on("change", ".field", searchfieldchange);
  $("#addrow").on("click", addsearchrow);
  $("#search").on("click", ".remove", removesearchrow);
  
  $("#submit").on("click", router);
});



function addsearchrow() {
  let rownum = numsearchrows+1;
  //because of deletions, numsearchrows may not actually match the number of rows displayed...
  let row = `<div class="row" id="row${rownum}">
  <label for="field${rownum}">Search field:</label>
  <select id="field${rownum}" class="field">
    <option></option>`;
  let fields = ["Stage", "Class", "Name", "Symmetry", "Leadlength", "Place notation", "Leadheads"];
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
  }
  
  $("#row"+r+" span").append(html);
}



// *** submit ***

function router() {
  let query = buildquery();
  queryobj = query;
  console.log(query);
  $("#container,#results tbody,#results thead").contents().remove();
  if (query.fields.length) {
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

const fields = ["stage", "class", "name", "pn", "leadlength", "symmetry", "leadheads"];
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

function buildsearch() {
  let query = {};
  let arrays = {};
  fields.forEach(field => {
    let vals;
    
    switch (field) {
      case "stage":
        vals = [];
        $("input.stage").each((i,e) => {
          if ($(e).is(":checked")) {
            let v = Number($(e).val());
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
            vals.push(v);
          }
        });
        arrays[field] = vals;
        break;
      case "name":
        if ($(".name").length > 1) {
          //multiple name searches
        } else if ($(".name").length) {
          let val = $(".name").val();
          if (val.startsWith("/") && val.endsWith("/")) {
            let regex = val.slice(1,-1);
            query.name = {"$regex": regex};
          } else if (val.length) {
            query.name = val;
          }
        }
        break;
      case "pn":
        if ($(".pn").length > 1) {
          
        } else if ($(".pn").length) {
          let pn = $(".pn").val();
          if (pn.length) {
            
            query.pn = {"$regex": pn};
          }
        }
        
        break;
      case "leadlength":
        vals = [];
        $(".leadlength").each((i,e) => {
          let v = Number($(e).val());
          if (v) {
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
        if (checked.length === 1) {
          let v = checked[0];
          switch (v) {
            case "plainbob":
              query.leadHeadCode = {$exists: true};
              query.huntBells = [1];
              break;
            case "grandsire":
              query.leadHeadCode = {$exists: true};
              query.huntBells = [1,2];
              break;
            case "other":
              query.leadHeadCode = {$exists: false};
              break;
          }
        } else if (checked.length === 2) {
          if (checked.includes("other")) {
            //$or needed, it's complicated
          } else {
            query.leadHeadCode = {$exists: true};
          }
        }
        break;
    }
    
    
  });
  for (let key in arrays) {
    if (arrays[key].length === 1) {
      query[key] = arrays[key][0];
    } else if (arrays[key].length > 1) {
      query[key] = {$in: arrays[key]};
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
  $("#container").contents().remove();
  if (res.length) {
    buildtable(res);
  } else {
    console.log(res);
  }
}

var differentfields = ["classification", "huntBells", "stationaryBells", "symmetry", "huntPath", "pbOrder"];
function buildtable(res) {
  let s = res.length > 1 ? "s" : "";
  let es = res.length > 1 ? "" : "es";
  $("#container").append(`<p>${res.length} method${s} match${es}</p>`);
  let cols = queryobj.fields.split(" ");
  $("#results thead").append(`<tr><th>${cols.join("</th><th>")}</th></tr>`);
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
  }
  return string;
}
