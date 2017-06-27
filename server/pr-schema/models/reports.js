const Reports = new Mongo.Collection('reports');

Reports.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

Meteor.startup(() => {
  Reports._collection._ensureIndex({ orderId: 1 });
});

export default Reports;
