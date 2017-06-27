import Consts from '/server/pr-schema/consts';
import Feedbacks from '/server/pr-schema/models/feedbacks';
import Users from '/server/pr-schema/models/users';
import { schemaValidate } from '/server/pr-schema/validate';
import { getFieldSetFromIdx, getIdxFromFieldSetName } from '/server/pr-schema/dataman-utils';

Meteor.methods({
  'feedbacks.create': (payload) => {
    const feedback = {
      userId: Meteor.userId() || '',
      phone: payload.phone,
      content: payload.content,
      isProcessed: false,
      createdAt: new Date(),
    };

    // validate失败时向client端返回errors
    const res = schemaValidate('feedbackSchema', feedback);
    if (res) {
      return { errors: res };
    }

    try {
      Feedbacks.insert(feedback);
    } catch (exception) {
      return { errors: exception.message };
    }
    return {};
  },
  'feedbacks.list': (fieldSetIdx) => {
    // 首先确保当前用户已经登录并且是管理员
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role <= Consts.USER_ROLE_AGENT)) { return { errors: '用户权限不足' }; }

    const efs = getFieldSetFromIdx('feedbacks', fieldSetIdx);
    const fields = { _id: 1 };
    if (efs) {
      for (const field of efs) {
        fields[field] = 1;
      }
    }

    const feedbacks = Feedbacks.find({}, { fields }).fetch();

    const uniqueUserIds = {};
    for (const feedback of feedbacks) {
      uniqueUserIds[feedback.userId] = 1;
    }
    const userFsi = getIdxFromFieldSetName('users', 'user-name');
    const users = Meteor.call('users.adminGetByIdList', Object.keys(uniqueUserIds), userFsi);

    return {
      feedbacks,
      users
    };
  },
  'feedbacks.edit': (data) => {
    // 首先确保当前用户已经登录并且是管理员
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role <= Consts.USER_ROLE_AGENT)) { return { errors: '用户权限不足' }; }

    // 我们目前并未进行防范恶意修改的验证, 毕竟需要管理员权限才能修改.
    data.isProcessed = data.isProcessed === 't';

    const feedback = {};
    const flds = ['procNotes', 'isProcessed'];
    for (const k of flds) {
      if (data[k] !== undefined) {
        feedback[k] = data[k];
      }
    }

    // 修改指定反馈
    Feedbacks.update({
      _id: data._id
    }, {
      $set: feedback
    });

    // 返回更新后的反馈
    const fsi = getIdxFromFieldSetName('feedbacks', 'feedback-admin');
    const efs = getFieldSetFromIdx('feedbacks', fsi);
    const fields = { _id: 1 };
    if (efs) {
      for (const field of efs) {
        fields[field] = 1;
      }
    }

    return Feedbacks.findOne({ _id: data._id }, { fields });
  },
});
