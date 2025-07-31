const fs = require("fs");

const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(process.env.CLIENT);
const buildvisits = require("./buildvisits.js");

//check if credential is valid and return any saved data
module.exports = function login(cookie, body, cb) {
  let i = cookie.indexOf("g_csrf_token=");
  if (i > -1) {
    let cookietoken = cookie.slice(i+13);
    let bodytoken = body["g_csrf_token"];
    if (bodytoken === cookietoken) {
      console.log("double submit cookie verified");
      verify(body.credential, cb).catch(console.error);
    } else {
      console.log('Failed to verify double submit cookie.');
      cb("");
    }
  } else {
    console.log("no token in cookie");
    cb("");
  }
  
}

async function verify(token, cb) {
  const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.CLIENT,  // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  });
  const payload = ticket.getPayload();
  const userid = payload['email'];
  
  let visits = [];
  if (fs.existsSync("/data/"+userid)) {
    fs.readdir("/data/"+userid, (err, files) => {
      if (err) console.log(err);
      files.sort();
      visits = require("../data/"+userid+"/"+files[files.length-1]);
      buildvisits(visits);
      cb(userid, visits);
    });
  } else {
    let name = Date.now();
    fs.mkdirSync("/data/"+userid);
    fs.writeFile("/data/"+userid+"/"+name+".json", "[]", (err) => {
      if (err) console.log(err);
      cb(userid, visits);
    });
    
  }
  
  //if (fs.existsSync("data/"+userid+".json")) {
  //  visits = require("../data/"+userid+".json");
  //  buildvisits(visits);
  //}
  
}
