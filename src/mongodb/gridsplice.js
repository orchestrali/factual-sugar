

//given a method and a bell, find methods of the same stage where the bell has the same path
module.exports = function gridsplice(query, bell) {
  //can query method by title or ccNum
  let q = {
    query: query,
    fields: "title stage hunts pnFull"
  };
  //get the method
  let m = {};
  //if bell is a hunt bell, error?
  //get methods of same stage and leadLength
  //or...I can query individual changes of the place notation, because of my pnFull array
  let q2 = {
    query: {
      
    }
  }
}

function getpp(pn, bell, stage) {
  let pp = [bell];
  let current = bell;
  for (let i = 0; i < pn.length; i++) {
    let change = pn[i];
    let next, dir;
    if (change === "x" || change[0] > current) {
      dir = current%2 === 1 ? 1 : -1;
    } else if (change.includes(current)) {
      dir = 0;
    } else {
      let before = change.filter(n => n < current);
      if (before.length) {
        //should be all the time
        let diff = current - before[before.length-1];
        dir = diff%2 === 1 ? 1 : -1;
      }
    }
    next = current + dir;
    pp.push(next);
    current = next;
  }
  return pp;
}

//given a pair of places and a stage, build the pns that would allow that change
function buildpnopts(pp, stage) {
  
}
