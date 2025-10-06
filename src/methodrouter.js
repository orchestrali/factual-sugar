const mongosearch = require("./mongodb/router.js");

//I think I won't use this after all...
module.exports = function methodrouter(request, reply) {
  let o = {
    fields: "title stage class ccNum pn pnFull leadsInCourse leadHeadCode leadLength",
    stage: [4,5,6,7,8,9,10,11,12].join(";")
  };
  mongosearch("method", o)
  .then((mm) => {
    let bigobj = {};
    let names = [{stage: 4, classes: []},{stage: 5, classes: []},{stage: 6, classes: []},{stage: 7, classes: []},{stage: 8, classes: []}, {stage: 9, classes: []}, {stage: 10, classes: []}, {stage: 11, classes: []}, {stage: 12, classes: []}];
    mm.forEach(m => {
      let small = {title: m.title, cc: "cc"+m.ccNum};
      let stageo = names[m.stage-4];
      let co = stageo.classes.find(obj => obj.class === m.class);
      if (co) {
        co.methods.push(small);
      } else {
        stageo.classes.push({class: m.class, methods: [small]});
      }
      bigobj[small.cc] = m;
    });

    
  });
}
