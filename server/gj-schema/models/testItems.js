const TestItems = new Mongo.Collection('testItems');

TestItems.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

export default TestItems;
