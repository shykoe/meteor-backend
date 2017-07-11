import { Meteor } from 'meteor/meteor';
import Users from '/server/pr-schema/models/users';
import addDummyData from '/imports/sample';

// 只有这样才能让Meteor将这些脚本加入build bundle, 从而可以在meteor shell中调用
// 参见: https://github.com/meteor/meteor/issues/7629#issuecomment-239196322
if (false) {  // eslint-disable-line
  require('/imports/sample');
}

Meteor.publish('user', function () {
  return Meteor.users.find({_id: this.userId});
});

let patched = false;
Meteor.startup(() => {
  addDummyData();
  // code to run on server at startup
  Meteor.server.onConnection(() => {
    if (!patched) {
      const Session = Object.values(Meteor.server.sessions)[0];
      const originalSend = Session.__proto__.send;    // eslint-disable-line
      Session.__proto__.send = function(msg) {        // eslint-disable-line
        if (msg.msg !== 'updated') {
          if (msg.msg === 'result' && msg.result && msg.result.id &&
              msg.result.token && msg.result.tokenExpires) {
            msg.result.fields = Users.findOne({ _id: msg.result.id }, { fields: {
              phone: 1,
              username: 1,
              role: 1,
            } });
            delete msg.result.fields._id;
          }
          originalSend.call(this, msg);
        }
      };
      console.log('Server patched!');   // eslint-disable-line
      patched = true;
    }
  });
});
