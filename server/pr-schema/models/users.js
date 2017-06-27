const Users = Meteor.users;

Users.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

Meteor.startup(() => {
  Users._collection._ensureIndex({ phone: 1 }, { unique: 1 });
});

export default Users;
