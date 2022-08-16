const path = require("path");

const buildtable = require("./src/buildtable.js");
//buildtable();

const login = require("./src/login.js");
const visit = [];
var updating = false;
const savevisits = require("./src/savevisits.js");
const delvisit = require("./src/delvisit.js");
const getvisits = require("./src/getvisits.js");

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  // set this to true for detailed logging:
  logger: false
});

// Setup our static files
fastify.register(require("fastify-static"), {
  root: path.join(__dirname, "public"),
  prefix: "/" // optional: default '/'
});

// fastify-formbody lets us parse incoming forms
fastify.register(require("fastify-formbody"));

// point-of-view is a templating manager for fastify
fastify.register(require("point-of-view"), {
  engine: {
    handlebars: require("handlebars")
  },
  options: {
    partials: {
      table: 'src/pages/table.hbs'
    }
  }
});

// Our main GET home page route, pulls from src/pages/index.hbs
fastify.get("/", function(request, reply) {
  //console.log("get");
  // params is an object we'll pass to our handlebars template
  let params = {
    greeting: "Hello Node!",
    email: "",
    years: [],
    days: [],
    visits: [],
    uri: "https://"+process.env.URI
  };
  for (let i = 1; i <= 31; i++) {
    params.days.push(i);
  }
  for (let i = 2022; i > 1960; i--) {
    params.years.push(i);
  }
  // request.query.paramName <-- a querystring example
  reply.view("/src/pages/myindex.hbs", params);
});

// A POST route to handle form submissions
fastify.post("/", function(request, reply) {
  //console.log("post");
  getvisits(request.body.email, (visits) => {
    reply.send(visits);
  });
  
  // request.body.paramName <-- a form post example
});

fastify.post("/visit", function(request, reply) {
  request.body.reply = reply;
  visit.push(request.body);
  //reply.send("ok");
  if (!updating) {
    updating = true;
    loop();
  }
});

fastify.post("/delete", function(request, reply) {
  console.log("deleting");
  delvisit(request.body, (err) => {
    reply.send(err ? "error" : "ok");
  });
});

function loop() {
  if (visit.length) {
    let vis = visit.shift();
    savevisits(vis, (v) => {
      if (v) {
        vis.reply.send(v);
      } else {
        vis.reply.send("ok");
      }
      loop();
    });
  } else {
    updating = false;
  }
}

// Run the server and report out to the logs
fastify.listen(process.env.PORT, '0.0.0.0', function(err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Your app is listening on ${address}`);
  fastify.log.info(`server listening on ${address}`);
});
