//query is object with keys "query" and "fields"

module.exports = async function findFields(db, mod, query) {
  const coll = db.collection(mod);
  let fields = {
    _id: 0
  };
  query.fields.split(" ").forEach(f => {
    fields[f] = 1;
  });

  const cursor = coll.find(query.query).project(fields);
  const array = await cursor.toArray();
  return array;
}
