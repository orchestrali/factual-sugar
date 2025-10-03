const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://"+process.env.USER+":"+process.env.PASS+"@cluster0.wompx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

module.exports = async function runGetStarted() {
  const client = new MongoClient(uri);

  try {
    const database = client.db('bellringing');
    const methods = database.collection('methods');

    const query = {title: "Kent Treble Bob Major"};
    const kent = await methods.findOne(query);

    console.log(kent);
    
  } finally {
    await client.close();
  }
}
