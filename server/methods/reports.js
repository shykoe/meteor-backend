import Consts from '/server/pr-schema/consts';
import Reports from '/server/pr-schema/models/reports';
import Orders from '/server/pr-schema/models/orders';
import Users from '/server/pr-schema/models/users';
import Meta from '/server/pr-schema/models/meta';

function padNum(num){
	var date = new Date().toLocaleDateString().split('-');
	var rel = '';
	for(var i in date){
		var nu = date[i];
		if(nu.length < 2){
			nu = '0' + nu;
		}

		rel += nu;
	}
	num = '00000' + num;

	rel += num.substring(num.length - 5, num.length);
	return rel;
}

Meteor.methods({
	'reports.find.orderid': (orderId) => {
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role < Consts.USER_ROLE_NORMAL)) { return { errors: '用户权限不足' }; }

		return Reports.findOne({ orderId });
	},
	'reports.upsert': (data, orderId, username) => {
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role < Consts.USER_ROLE_NORMAL)) { return { errors: '用户权限不足' }; }

		// Find report by orderId upsert
		data.userId = currentUser._id;
		data.orderId = orderId;

    /*
		var num = Meta.findAndModify({
			query: { name: "reportNo" },
			update: { $inc: { value: 1 } },
			fields: { value: 1 }
		}).value;

		data.reportNo = padNum(num);
    */

		const rel = Reports.upsert({ orderId }, data);
		if (rel.insertedId) {
			Orders.update({ _id: orderId }, { $set: {
        status: Consts.ORDER_STATUS_TESTED,
        testedAt: new Date() / 1
      } });
		}
	},
  'reports.get': (reportNo) => {
    const report = Reports.findOne({ reportNo });
    return report;
  }
})
