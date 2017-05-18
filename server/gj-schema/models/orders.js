const Orders = new Mongo.Collection('orders');

Orders.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

Meteor.startup(() => {
  Orders._collection._ensureIndex({ userId: 1 });
});

export default Orders;
