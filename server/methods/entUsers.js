import Consts from '/server/pr-schema/consts';
import Users from '/server/pr-schema/models/users';
import { schemaValidate } from '/server/pr-schema/validate';

Meteor.methods({
  'users.role': (username) => {
    return Users.findOne({ username }, { fields: { role: 1 } }).role;
  },

  'user.getid': (userName) => {
    // 首先确保当前用户已经登录并且是企业员工
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role < Consts.USER_ROLE_NORMAL)) { return { errors: '用户权限不足' }; }

    return currentUser._id;
  },

  'tester.get': () => {
    // 首先确保当前用户已经登录并且是企业员工
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role < Consts.USER_ROLE_NORMAL)) { return { errors: '用户权限不足' }; }

  	return Users.find({
      role: Consts.USER_ROLE_TESTER
    }, {
      fields: { _id: 1, name: 1 }
    }).fetch();
  },

  'agent.get': () => {
    // 首先确保当前用户已经登录并且是企业员工
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role < Consts.USER_ROLE_NORMAL)) { return { errors: '用户权限不足' }; }

    return Users.find({
      role: Consts.USER_ROLE_AGENT
    }, {
      fields: { _id: 1, name: 1 }
    }).fetch();
  },

  'agent.adduser.updateData': (id, data) => {
    // 首先确保当前用户已经登录并且是企业管理员
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role === Consts.USER_ROLE_ADMIN)) { return { errors: '用户权限不足' }; }

    const { password, role, username } = data;
    return Users.update({ _id: id }, { $set: { role } });
  },

  'agent.adduser.createUser': (data) => {
    // 首先确保当前用户已经登录并且是企业管理员
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role === Consts.USER_ROLE_ADMIN)) { return { errors: '用户权限不足' }; }

    const { password, role, username, phone } = data;
    const nowDate = new Date();
    const user = {
      phone,
      username,
      password,
      role,
      createdAt: nowDate / 1,
    };

    const res = schemaValidate('userSchema', user);
    if (res) {
      return { errors: '数据格式错误' };
    }

    const userId = Accounts.createUser(user);
    return Users.findOne({ _id: userId });
  },

  'agent.adduser.checkUsername': (username) => {
    // 首先确保当前用户已经登录并且是企业管理员
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role === Consts.USER_ROLE_ADMIN)) { return { errors: '用户权限不足' }; }

    var x = Users.findOne({ username });
    return typeof x !== "undefined";
  },

  'setPWDReset': () => {
    // 首先确保当前用户已经登录并且是企业员工
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role < Consts.USER_ROLE_NORMAL)) { return { errors: '用户权限不足' }; }

    const result = Users.update({
      _id: currentUser._id,
      isPasswordReseted: undefined
    }, { $set: { isPasswordReseted: true } });
    return result;
  },

  'checkPWDReset': (userName) => {
    // 首先确保当前用户已经登录并且是企业员工
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role < Consts.USER_ROLE_NORMAL)) { return { errors: '用户权限不足' }; }

    return currentUser && currentUser.isPasswordReseted;
  }
});
