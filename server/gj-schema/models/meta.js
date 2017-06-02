const Meta = new Mongo.Collection('meta');

Meta.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

Meteor.startup(() => {
  Meta._collection._ensureIndex({ name: 1 }, { unique: 1 });
});

export default Meta;
