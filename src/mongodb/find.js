

module.exports = async function find(db, mod, query) {
  const coll = db.collection(mod);

  const cursor = coll.find(query);
  const array = await cursor.toArray();
  return array;
}
