const Recharges = new Mongo.Collection('recharges');

Recharges.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

Meteor.startup(() => {
  Recharges._collection._ensureIndex({ userId: 1 });
});

export default Recharges;
