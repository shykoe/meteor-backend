const TesterOps = new Mongo.Collection('testerOps');

TesterOps.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

Meteor.startup(() => {
  TesterOps._collection._ensureIndex({ userId: 1 });
});

export default TesterOps;
