import Consts from '/server/pr-schema/consts';
import TesterOps from '/server/pr-schema/models/testerOps';
import Users from '/server/pr-schema/models/users';
import Orders from '/server/pr-schema/models/orders';

Meteor.methods({
  'agent.checktest.get': ( page, perpage, field, order) => {
    // 首先确保当前用户已经登录并且是管理员
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role === Consts.USER_ROLE_ADMIN)) { return { errors: '用户权限不足' }; }

    const skipped = ( parseInt(page) - 1 ) * parseInt(perpage);
    const sortOrder = order == 'ASC' ? 'asc' : 'desc';
    const query = TesterOps.find({}, {
      skip: parseInt(skipped),
      limit: parseInt(perpage),
      sort: [[ field, sortOrder ]]
    });

    const records = query.fetch();
    const total = query.count();

    for (const record of records){
      const orderId = record.orderId;
      const userId = record.userId;
      resultOrder = Orders.findOne({ _id: orderId }, { fields: { sampleProducer: 1, sampleName: 1 } });
      resultUser = Users.findOne({ _id: userId }, { fields: { username: 1 } });
      record.order = resultOrder.sampleProducer + ', ' + resultOrder.sampleName;
      record.user = resultUser.username;
    }

    return {
      data: records,
      total
    };
  },
});
