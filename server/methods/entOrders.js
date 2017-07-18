import Consts from '/server/pr-schema/consts';
import Orders from '/server/pr-schema/models/orders';
import Reports from '/server/pr-schema/models/reports';
import Users from '/server/pr-schema/models/users';
import Categories from '/server/pr-schema/models/categories';

function enhanceOrders(orders) {
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

  return orders;
}

Meteor.methods({
  //find own orders
  'agent.myorders.get': (userName, role, page, perpage, field, order) => {
    // 首先确保当前用户已经登录并且是公司业务员
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role === Consts.USER_ROLE_AGENT)) { return { errors: '用户权限不足' }; }

  	const skipped = (parseInt(page) - 1) * parseInt(perpage);
  	const sortOrder = order === 'ASC' ? 'asc' : 'desc';
    const orders = Orders.find({ agentId: currentUser._id }, {
      skip: parseInt(skipped),
      limit: parseInt(perpage),
      sort: [[ field, sortOrder ]]
    }).fetch();

    return enhanceOrders(orders);
  },

  'agent.orders.get': (userName, role, page, perpage, field, order, filter) => {
    // 首先确保当前用户已经登录并且是公司员工
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role < Consts.USER_ROLE_NORMAL)) { return { errors: '用户权限不足' }; }

    const skipped = (parseInt(page) - 1) * parseInt(perpage);
    const sortOrder = order === 'ASC' ? 'asc' : 'desc';
    const orders = Orders.find(filter || {}, {
      skip: parseInt(skipped),
      limit: parseInt(perpage),
      sort: [[ field, sortOrder ]]
    }).fetch();

    return enhanceOrders(orders);
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

    const { categoryName, levelName, items, agentMsg, status, price, ShippingInfo } = data;
    const rel = Orders.update({
      _id: id,
      agentId: currentUser._id
    }, {
      $set: {
        categoryName,
        levelName,
        items,
        agentMsg,
        status,
        price,
        ShippingInfo
      }
    });

    if(rel === 0){
      return Promise.reject('data error');
    }

    return Orders.findOne({
      '_id': id,
      agentId: currentUser._id
    });
  },

  //find the orders by the tester's username
  'tester.orders.get': (userName, role, page, perpage, field, order) => {
    // 首先确保当前用户已经登录并且是公司检验员
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role === Consts.USER_ROLE_TESTER)) { return { errors: '用户权限不足' }; }

    const skipped = (parseInt(page) - 1) * parseInt(perpage);
    const sortOrder = order === 'ASC' ? 'asc' : 'desc';
    return Orders.find({
      testers: currentUser._id
    }, {
      skip: parseInt(skipped),
      limit: parseInt(perpage),
      sort: [[ field, sortOrder ]]
    }).fetch();
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

    const order = Orders.findOne({ _id: id });
    Meteor.call('testerOps.update', order, ops, userName);

    if(rel === 0){
      return Promise.reject('data error');
    }
    return Orders.findOne({ _id: id });
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
  'orders.get':(page, perpage, field, order, filter)=>{
    // 首先确保当前用户已经登录并且是企业员工
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role < Consts.USER_ROLE_NORMAL)) { return { errors: '用户权限不足' }; }

    const skipped = (parseInt(page) - 1) * parseInt(perpage);
    const sortOrder = order === 'ASC' ? 'asc' : 'desc';
    if(filter.status) {
      return Orders.find({
        status: {
          $in: filter.status
        }
      },{
        skip: parseInt(skipped),
        limit: parseInt(perpage),
        sort: [[ field, orderid ]]
      }).fetch();
    }

    return Orders.find({}, {
      skip: parseInt(skipped),
      limit:parseInt(perpage),
      sort: [[ field, sortOrder ]]
    }).fetch();
  },

  'keeper.order.update':(id,data)=>{
    // 首先确保当前用户已经登录并且是公司仓库操作员
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role === Consts.USER_ROLE_KEEPER)) { return { errors: '用户权限不足' }; }

    const { status } = data;
    const rel = Orders.update({ _id: id }, { $set: { status } });
    return Orders.findOne({ _id: id });
  },

  //assigner set the order's testers
  'assigner.tester.set':(id, data)=>{
    // 首先确保当前用户已经登录并且是公司仓库操作员
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role === Consts.USER_ROLE_ASSIGNER)) { return { errors: '用户权限不足' }; }

    const { tester } = data;
    const rel = Orders.update({ _id: id }, { $set: { tester, status: 9 } });
    return Orders.findOne({ _id: id });
  },

  'agent.allorder.get': (page, perpage, field, order) => {
    // 首先确保当前用户已经登录并且是公司业务员
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role === Consts.USER_ROLE_AGENT)) { return { errors: '用户权限不足' }; }

    const skipped = (parseInt(page) - 1) * parseInt(perpage);
    x = Orders.find({}, {
      skip: parseInt(skipped),
      limit: parseInt(perpage),
      sort: [order]
    }).fetch();
    return x;
  },

  'agent.allorder.getFilter': ( page, perpage, field, order,myfilter) => {
    // 首先确保当前用户已经登录并且是公司业务员
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role === Consts.USER_ROLE_AGENT)) { return { errors: '用户权限不足' }; }

    const skipped = (parseInt(page) - 1) * parseInt(perpage);
    x = Orders.find(myfilter, {
      skip: parseInt(skipped),
      limit: parseInt(perpage),
      sort: [order]
    }).fetch();
    return x;
  }
});
