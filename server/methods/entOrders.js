import Consts from '/server/pr-schema/consts';
import Orders from '/server/pr-schema/models/orders';
import Reports from '/server/pr-schema/models/reports';
import Users from '/server/pr-schema/models/users';
import Categories from '/server/pr-schema/models/categories';
import TesterOps from '/server/pr-schema/models/testerOps';

function enhanceOrders(orders, total) {
  // Fetch the agent usernames and tester usernames referenced in these orders
  // as we need them for display.
  const userDict = {}
  for (const order of orders) {
    if (order.agentId) {
      userDict[order.agentId] = 1;
    }
    if (order.testerIds) {
      for (const testerId of order.testerIds) {
        userDict[testerId] = 1;
      }
    }
  }

  const users = Users.find({
    _id: { $in: Object.keys(userDict) }
  }, {
    fields: { _id: 1, username: 1 }
  }).fetch();
  for (const user of users) {
    userDict[user._id] = user.username;
  }

  for (const order of orders) {
    if (order.agentId) {
      order.agent = userDict[order.agentId];
    }
    if (order.testerIds) {
      const testers = [];
      for (const testerId of order.testerIds) {
        testers.push(userDict[testerId]);
      }
      order.testers = testers;
    }
  }

  if (total !== undefined) {
    return {
      data: orders,
      total
    };
  } else {
    return orders;
  }
}

function updateTesterOps(data, ops, userId) {
  const {
    _id,
    levelName,
    categoryName,
  } = data;

  for (const itemName in ops) {
    if (ops[itemName] !== undefined) {
      TesterOps.insert({
        levelName,
        categoryName,
        itemName,
        verdict: ops[itemName],
        userId,
        orderId: _id,
        createdAt: new Date() / 1
      });
    }
  }
}

Meteor.methods({
  //find own orders
  'agent.myorders.get': (userName, role, page, perpage, field, order, filter) => {
    // 首先确保当前用户已经登录并且是公司业务员
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role === Consts.USER_ROLE_AGENT)) { return { errors: '用户权限不足' }; }

  	const skipped = (parseInt(page) - 1) * parseInt(perpage);
  	const sortOrder = order === 'ASC' ? 'asc' : 'desc';

    let finalFilter;
    if (filter.agentId && filter.agentId.$eq !== undefined &&
        filter.agentId.$eq !== currentUser._id) {
      finalFilter = {
        ...filter,
        agentId: { eq: 'N/A' }
      };
    } else {
      finalFilter = {
        ...filter,
        agentId: {
          ...filter.agentId,
          $eq: currentUser._id
        }
      };
    }

    const query = Orders.find(finalFilter, {
      skip: parseInt(skipped),
      limit: parseInt(perpage),
      sort: [[ field, sortOrder ]]
    });

    return enhanceOrders(query.fetch(), query.count());
  },

  'agent.orders.get': (userName, role, page, perpage, field, order, filter) => {
    // 首先确保当前用户已经登录并且是公司员工
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role < Consts.USER_ROLE_NORMAL)) { return { errors: '用户权限不足' }; }

    const skipped = (parseInt(page) - 1) * parseInt(perpage);
    const sortOrder = order === 'ASC' ? 'asc' : 'desc';
    const query = Orders.find(filter || {}, {
      skip: parseInt(skipped),
      limit: parseInt(perpage),
      sort: [[ field, sortOrder ]]
    });

    return enhanceOrders(query.fetch(), query.count());
  },

  //find one order by id
  'order.get': (id) => {
    // 首先确保当前用户已经登录并且是企业员工
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role < Consts.USER_ROLE_NORMAL)) { return { errors: '用户权限不足' }; }

    return enhanceOrders([Orders.findOne({ '_id': id })])[0];
  },

  //accept the order, set the order.agent equals id
  'agent.order.accept': (id, userName) => {
    // 首先确保当前用户已经登录并且是公司业务员
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role === Consts.USER_ROLE_AGENT)) { return { errors: '用户权限不足' }; }

    const result = Orders.update({
      _id: id
    }, {
      $set: {
        agentId: currentUser._id
      }
    });

    return Promise.resolve('ok');
  },

  'agent.order.unpick': (id) => {
    // 首先确保当前用户已经登录并且是公司业务员
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role === Consts.USER_ROLE_AGENT)) { return { errors: '用户权限不足' }; }

    const result = Orders.update({
      _id: id,
      agentId: currentUser._id
    }, {
      $set: {
        agentId: undefined
      }
    });

    return Promise.resolve('ok');
  },

  //agent approved the order
  'agent.order.approve': (id, data) => {
    // 首先确保当前用户已经登录并且是公司业务员
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role === Consts.USER_ROLE_AGENT)) { return { errors: '用户权限不足' }; }

    const { categoryName, levelName, items, agentMsg, status, price, ShippingInfo,
            activeCustServReply } = data;

    const updateObj = {
      $set: {
        categoryName,
        levelName,
        items,
        agentMsg,
        status,
        price,
        ShippingInfo
      }
    };

    if (status === Consts.ORDER_STATUS_APPROVED) {
      updateObj.$set.approvedAt = new Date() / 1;
    } else if (status === Consts.ORDER_STATUS_REJECTED) {
      updateObj.$set.rejectedAt = new Date() / 1;
    }

    if (activeCustServReply) {
      const order = Orders.findOne({
        _id: id,
        agentId: currentUser._id
      });

      if (order && order.activeCustServRequest) {
        updateObj.$set.activeCustServRequest = null;
        updateObj.$push = {
          custServHistory: {
            $each: [{
              request: order.activeCustServRequest,
              reply: activeCustServReply
            }],
            $position: 0
          }
        };
      }
    }

    const rel = Orders.update({
      _id: id,
      agentId: currentUser._id
    }, updateObj);

    if(rel === 0){
      return Promise.reject('data error');
    }

    return enhanceOrders([Orders.findOne({
      '_id': id,
      agentId: currentUser._id
    })])[0];
  },

  //find the orders by the tester's username
  'tester.orders.get': (userName, role, page, perpage, field, order, filter) => {
    // 首先确保当前用户已经登录并且是公司检验员
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role === Consts.USER_ROLE_TESTER)) { return { errors: '用户权限不足' }; }

    const skipped = (parseInt(page) - 1) * parseInt(perpage);
    const sortOrder = order === 'ASC' ? 'asc' : 'desc';
    const query = Orders.find({
      ...filter,
      testerIds: currentUser._id
    }, {
      skip: parseInt(skipped),
      limit: parseInt(perpage),
      sort: [[ field, sortOrder ]]
    });

    return enhanceOrders(query.fetch(), query.count());
  },

  //tester update
  'tester.order.update': (id, data, ops, userName) => {
    // 首先确保当前用户已经登录并且是公司检验员
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role === Consts.USER_ROLE_TESTER)) { return { errors: '用户权限不足' }; }

    const { items } = data;
    const rel = Orders.update({
      _id: id
    }, {
      $set: {
        items
      }
    });

    updateTesterOps(data, ops, currentUser._id);

    if(rel === 0){
      return Promise.reject('data error');
    }

    return enhanceOrders([Orders.findOne({ _id: id })])[0];
  },

  'tester.img.update': (id, data) => {
    // 首先确保当前用户已经登录并且是公司检验员
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role === Consts.USER_ROLE_TESTER)) { return { errors: '用户权限不足' }; }

    const rel = Orders.update({ _id: id }, { $push: { testingImages: data } });
    if(rel === 0){
      return Promise.reject('data error');
    }
    return Promise.resolve();
  },

  'keeper.img.update': (id, data) => {
    // 首先确保当前用户已经登录并且是公司仓库操作员
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role === Consts.USER_ROLE_KEEPER)) { return { errors: '用户权限不足' }; }

    const rel = Orders.update({ _id: id }, {
      $push: {
        sampleImages: data
      }
    });
    if(rel === 0){
      return Promise.reject('data error');
    }
    return Promise.resolve();
  },

  // find all orders
  'orders.get': (page, perpage, field, order, filter) => {
    // 首先确保当前用户已经登录并且是企业员工
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role < Consts.USER_ROLE_NORMAL)) { return { errors: '用户权限不足' }; }

    const skipped = (parseInt(page) - 1) * parseInt(perpage);
    const sortOrder = order === 'ASC' ? 'asc' : 'desc';

    const query = Orders.find(filter || {}, {
      skip: parseInt(skipped),
      limit: parseInt(perpage),
      sort: [[ field, sortOrder ]]
    });

    return enhanceOrders(query.fetch(), query.count());
  },

  'keeper.order.update': (id, data) => {
    // 首先确保当前用户已经登录并且是公司仓库操作员
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role === Consts.USER_ROLE_KEEPER)) { return { errors: '用户权限不足' }; }

    const { status, keeperMsg } = data;
    const setObj = {};
    if (status) {
      setObj.status = status;
      if (status === Consts.ORDER_STATUS_SAMPLE_RECEIVED) {
        setObj.sampleReceivedAt = new Date() / 1;
      }
    }
    if (keeperMsg) {
      setObj.keeperMsg = keeperMsg;
    }

    const rel = Orders.update({ _id: id }, { $set: setObj });
    return enhanceOrders([Orders.findOne({ _id: id })])[0];
  },

  //assigner set the order's testers
  'assigner.tester.set': (id, data) => {
    // 首先确保当前用户已经登录并且是公司仓库操作员
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role === Consts.USER_ROLE_ASSIGNER)) { return { errors: '用户权限不足' }; }

    const { testerIds } = data;
    const rel = Orders.update({ _id: id }, { $set: { testerIds, status: Consts.ORDER_STATUS_ASSIGNED } });
    return enhanceOrders([Orders.findOne({ _id: id })])[0];
  },

  'agent.allorder.get': (page, perpage, field, order, filter) => {
    // 首先确保当前用户已经登录并且是公司业务员或管理员
    const currentUser = Meteor.user();

    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role <= Consts.USER_ROLE_AGENT)) { return { errors: '用户权限不足' }; }

    const skipped = (parseInt(page) - 1) * parseInt(perpage);
    const sortOrder = order === 'ASC' ? 'asc' : 'desc';

    const query = Orders.find(filter || {}, {
      skip: parseInt(skipped),
      limit: parseInt(perpage),
      sort: [[ field, sortOrder ]]
    });

    return enhanceOrders(query.fetch(), query.count());
  },

  'agent.adduser.get': (page, perpage, field, order) => {
    // 首先确保当前用户已经登录并且是企业管理员
    const currentUser = Meteor.user();

    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role === Consts.USER_ROLE_ADMIN)) { return { errors: '用户权限不足' }; }

    const skipped = (parseInt(page) - 1) * parseInt(perpage);
    const sortOrder = order === 'ASC' ? 'asc' : 'desc';
    const query = Users.find({
      role: { $lt: Consts.USER_ROLE_NORMAL }
    }, {
      fields: { username: 1, role: 1, password: 1 },
      skip: parseInt(skipped),
      limit: parseInt(perpage),
      sort: [[ field, sortOrder ]]
    });

    return enhanceOrders(query.fetch(), query.count());
  },

  'agent.adduser.getOne': (id) => {
    // 首先确保当前用户已经登录并且是企业管理员
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role === Consts.USER_ROLE_ADMIN)) { return { errors: '用户权限不足' }; }

     return Users.findOne({ _id: id }, { fields: { username: 1, role: 1, password: 1 } });
  },
});
