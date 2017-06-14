Meteor.methods({
  'time.getCurrent': () => {
    return new Date();
  }
});
