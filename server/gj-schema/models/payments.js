const Payments = new Mongo.Collection('payments');

Payments.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

Meteor.startup(() => {
  Payments._collection._ensureIndex({ userId: 1 });
});

export default Payments;
