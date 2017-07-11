import TesterOps from '/server/pr-schema/models/testerOps';
import Users from '/server/pr-schema/models/users';
import Orders from '/server/pr-schema/models/orders';

Meteor.methods({
  'agent.checktest.get': ( page, perpage, field, order) => {
    const skiped = ( parseInt(page) - 1 ) * parseInt(perpage);
    const orderid = order == 'ASC' ? 'asc':'desc';
    const orderi='ASC' ? 1:-1;
    x=TesterOps.find({},{skip:parseInt(skiped), limit:parseInt(perpage), sort:[[ field, orderid ]]}).fetch();

    for(var item in x){
      var orderId=x[item]['OrderID'];
      var userId=x[item]['userID'];
      console.log('--',orderId,userId);
      resultOrder=Orders.findOne({'_id':orderId},{fields:{"sampleProducer":1,"sampleName":1}});
      resultUser=Users.findOne({'_id':userId},{fields:{"username":1}});
      x[item]['order']=resultOrder['sampleProducer']+'+'+resultOrder['sampleName'];
      x[item]['user']=resultUser['username'];
    }

    return x;

  },
  'testerOps.update':(data, ops, userName)=>{
    const {
      _id,
      levelName,
      categoryName,
    } = data;
    const userId = Users.findOne({username:userName})._id;
    var date = new Date()
    for(var itemName in ops ){
      if(ops[itemName]){
            TesterOps.insert({levelName:levelName, categoryName:categoryName, itemName:itemName,
            result:ops[itemName].result, verdict:ops[itemName].verdict, userID:userId,
            createAt:parseInt(date.getTime()/1000) , OrderID:_id})
      }
    }
  }

});
