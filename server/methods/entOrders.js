import Orders from '/server/pr-schema/models/orders';
import Reports from '/server/pr-schema/models/reports';
import Users from '/server/pr-schema/models/users';
import Categories from '/server/pr-schema/models/categories';

Meteor.methods({
  //find own orders
  'agent.myorders.get': (userName, role, page, perpage, field, order) => {
  	const userid = Meteor.call('user.getid',userName);
  	const skiped = ( parseInt(page) - 1 ) * parseInt(perpage);
  	const orderid = order == 'ASC' ? 'asc':'desc';
    return Orders.find({'agent':userid},{skip:parseInt(skiped), limit:parseInt(perpage), sort:[[ field, orderid ]] }).fetch();
  },
  'agent.orders.get':(userName, role, page, perpage, field, order, filter) => {
    const skiped = ( parseInt(page) - 1 ) * parseInt(perpage);
    const orderid = order == 'ASC' ? 'asc':'desc';
    const nowFilter = filter? filter:{};
    return Orders.find(nowFilter,{skip:parseInt(skiped), limit:parseInt(perpage), sort:[[ field, orderid ]] }).fetch();
  },
  //find one order by id
  'order.get':(id) =>{
    return Orders.findOne({'_id':id});
  },
  //accept the order, set the order.agent equals id
  'agent.order.accept':(id, userName) =>{
    const userId = Users.findOne({username:userName})._id;
    const status = Orders.findOne({_id:id}).status;
    var count;
    //中途agent可以取消领取..所以可能不改变status
    if(status == 1){
      count = Orders.update({_id:id}, {$set:{agent:userId, status:2}});
      return Promise.resolve('ok');
    }else{
      count = Orders.update({_id:id}, {$set:{agent:userId}});
      return Promise.resolve('ok');
    }
  },
  'agent.order.unpick':(id)=>{
    const count = Orders.update({_id:id}, {$set:{agent:null}});
  },
  //agent approved the order
  'agent.order.approve':(id, data)=>{
    const { categoryName, levelName, items, agentMsg, status, price, ShippingInfo } = data;
    const rel = Orders.update({_id:id}, {$set:{categoryName:categoryName, levelName:levelName, items:items, agentMsg:agentMsg, status:status, price:price, ShippingInfo:ShippingInfo}});
    if(rel == 0){
      return Promise.reject('data error');
    }
    return Orders.findOne({'_id':id});

  },
  //find the orders by the tester's username
  'tester.orders.get':(userName, role, page, perpage, field, order) =>{
    const userid = Meteor.call('user.getid',userName);
    const skiped = ( parseInt(page) - 1 ) * parseInt(perpage);
    const orderid = order == 'ASC' ? 'asc':'desc';
    return Orders.find({'tester':userid},{skip:parseInt(skiped), limit:parseInt(perpage), sort:[[ field, orderid ]] }).fetch();
  },
  //tester update
  'tester.order.update':(id, data, ops, userName)=>{
    const { items } = data;
    const rel = Orders.update({'_id':id},{$set:{items:items}});
    const order = Orders.findOne({'_id':id});
    Meteor.call('testerOps.update', order, ops, userName);
    if(rel == 0){
      return Promise.reject('data error');
    }
    return Orders.findOne({'_id':id});

  },
  'tester.img.update':(id, data)=>{
    const rel = Orders.update({'_id':id},{$push:{testingImages:data}});
    if(rel == 0){
      return Promise.reject('data error');
    }
    return Promise.resolve();
  },
  'keeper.img.update':(id, data)=>{
    const rel = Orders.update({'_id':id},{$push:{sampleImages:data}});
    if(rel == 0){
      return Promise.reject('data error');
    }
    return Promise.resolve();
  },
  // find all orders
  'orders.get':(page, perpage, field, order, filter)=>{
    const skiped = ( parseInt(page) - 1 ) * parseInt(perpage);
    const orderid = order == 'ASC' ? 'asc':'desc';
    if(filter.status){
      return Orders.find({status:{$in:filter.status}},{skip:parseInt(skiped), limit:parseInt(perpage), sort:[[ field, orderid ]] }).fetch();
    }
    return Orders.find({},{skip:parseInt(skiped), limit:parseInt(perpage), sort:[[ field, orderid ]] }).fetch();
  },
  'keeper.order.update':(id,data)=>{
    const { status } = data;
    const rel = Orders.update({'_id':id},{$set:{status:status}});
    return Orders.findOne({'_id':id});
  },
  //assigner set the order's testers
  'assigner.tester.set':(id, data)=>{
    const { tester } = data;
    const rel = Orders.update({'_id':id}, {$set:{tester:tester, status:9}} );
    return Orders.findOne({'_id':id});
  },
  'agent.allorder.get': ( page, perpage, field, order) => {
    const skiped = ( parseInt(page) - 1 ) * parseInt(perpage);

    x=Orders.find({},{skip:parseInt(skiped), limit:parseInt(perpage), sort:[order]}).fetch();
    return x;

  },
  'agent.allorder.getFilter': ( page, perpage, field, order,myfilter) => {
    const skiped = ( parseInt(page) - 1 ) * parseInt(perpage);
    x=Orders.find(myfilter,{skip:parseInt(skiped), limit:parseInt(perpage), sort:[order]}).fetch();
    return x;

  }
});
