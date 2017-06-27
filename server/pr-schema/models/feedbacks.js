const Feedbacks = new Mongo.Collection('feedbacks');

Feedbacks.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

export default Feedbacks;
