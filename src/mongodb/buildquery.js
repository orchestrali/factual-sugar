const fields = ["stage", "class", "name", "pn", "leadlength", "symmetry", "leadheads"];

module.exports = function buildquery(o) {
  let q = {
    fields: o.fields
  };
  let query = {};

  for (let key in o) {
    switch (key) {
      case "stage": case "leadLength":
        if (o[key].includes(";")) {
          let v = o[key].split(";").map(n => Number(n));
          query[key] = {$in: v};
        } else {
          query[key] = Number(o[key]);
        }
        break;
      case "class": case "symmetry":
        if (o[key].includes(";")) {
          let v = o[key].split(";");
          query[key] = {$in: v};
        } else {
          query[key] = o[key];
        }
        break;
      case "name":
        if (o[key].startsWith("/")) {
          let endslash = o[key].lastIndexOf("/");
          let opts = endslash < o[key].length-1 ? o[key].slice(endslash) : "";
          query.name = {$regex: o[key].slice(1,endslash), $options: opts};
        } else {
          query.name = o[key];
        }
        break;
      case "pn":
        query.pn = {$regex: o[key]};
        break;
      case "leadheads":
        if (o[key].length === 1) {
          let v = o[key][0];
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
        } else if (o[key].length === 2) {
          if (o[key].includes("other")) {
            let second = {leadHeadCode: {$exists: true}};
            second.huntBells = o[key].includes("plainbob") ? [1] : [1,2];
            query.$or = [{leadHeadCode: {$exists: false}}, second];
          } else {
            query.leadHeadCode = {$exists: true};
          }
        }
        break;
    }
  }

  q.query = query;
  return q;
}
