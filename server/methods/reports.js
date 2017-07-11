import Reports from '/server/pr-schema/models/reports';
import Orders from '/server/pr-schema/models/orders';
import Users from '/server/pr-schema/models/users';
import Meta from '/server/pr-schema/models/meta';

function padNum(num){
	var date = new Date().toLocaleDateString().split('-');
	var rel = '';
	for(var i in date){
		var nu = date[i];
		if(nu.length<2){
			nu = '0' + nu;
		}

		rel += nu;
	}
	num = '00000' + num;

	rel += num.substring(num.length-5, num.length);
	return rel;
}
Meteor.methods({
	'reports.find.orderid':(orderid)=>{
		return Reports.findOne({'orderId':orderid});
	},
	'reports.upsert':(data, orderid, username)=>{
		//find report by orderid upsert
		const userId = Users.findOne({'username':username})._id;
		data.userId = userId;
		data.orderId = orderid;
		var num = Meta.findAndModify({
			query: {name: "reportNo"},
			update: {$inc: {value:1}},
			fields: {value: 1}
		}).value;

		data.reportNo = padNum(num);
		const rel = Reports.upsert({orderId:orderid},data);
		if(rel){
			Orders.update({'_id':orderid},{$set:{status:10}});
		}
	}
})
