const Verification = new Mongo.Collection('verification');

Verification.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

Meteor.startup(() => {
  Verification._collection._ensureIndex({ phone: 1 });
});

export default Verification;
