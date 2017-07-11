import Categories from '/server/pr-schema/models/categories';

Meteor.methods({
  'Categories.getAll': () => {
    return Categories.find({},{fields:{'_id':0}}).fetch();
  }
});
