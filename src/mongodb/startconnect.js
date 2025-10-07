const { MongoClient } = require('mongodb');
const find = require("./findfields.js");

const uri = "mongodb+srv://"+process.env.USER+":"+process.env.PASS+"@cluster0.wompx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

module.exports = async function runGetStarted(o) {
  //console.log("attempting to connect");
  const client = new MongoClient(uri);

  try {
    const database = client.db('bellringing');

    if (o) {
      //console.log("searching");
      //console.log(o.query);
      const results = await find(database, o.model, o.query);
      //console.log(results.length);
      return results;
    }
    /*
    const methods = database.collection('methods');

    const query = {title: "Kent Treble Bob Major"};
    const kent = await methods.findOne(query);

    console.log(kent);
    */
  } finally {
    await client.close();
  }
}
