import crypto from 'crypto';
import Consts from '/server/pr-schema/consts';
import Orders from '/server/pr-schema/models/orders';
import Users from '/server/pr-schema/models/users';
import Payments from '/server/pr-schema/models/payments';
import {
  paymentDeadlineAfterApproval,
  resubmitDeadlineAfterRejection,
  alipayAppId,
  alipaySellerId,
  alipayPrivateKey,
  alipayPlatformPublicKey
} from '/server/config';
import { getRandomInt, round, round2 } from '/server/kh-helpers/math';
import { schemaValidate } from '/server/pr-schema/validate';
import { getFieldSetFromIdx, getIdxFromFieldSetName } from '/server/pr-schema/dataman-utils';

function generateOrderId(nowDate) {
  let rand8 = '';
  for (let i = 0; i < 8; i++) {
    rand8 += getRandomInt(0, 9);
  }
  return String(nowDate.getFullYear()) +
          `0${String(nowDate.getMonth() + 1)}`.slice(-2) +
          `0${String(nowDate.getDate())}`.slice(-2) +
          rand8;
}

Meteor.methods({
  'orders.list': (selector, fieldSetIdx) => {
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }

    const efs = getFieldSetFromIdx('orders', fieldSetIdx);
    const fields = { _id: 1 };
    if (efs) {
      for (const field of efs) {
        fields[field] = 1;
      }
    }

    // 只能获取当前用户的订单列表
    const orders = Orders.find(Object.assign({}, selector, {
      userId: currentUser._id
    }), { fields }).fetch();

    return { orders };
  },
  'orders.adminList': (selector, fieldSetIdx) => {
    // 首先确保当前用户已经登录并且是管理员
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role < Consts.USER_ROLE_NORMAL)) { return { errors: '用户权限不足' }; }

    const efs = getFieldSetFromIdx('orders', fieldSetIdx);
    const fields = { _id: 1 };
    if (efs) {
      for (const field of efs) {
        fields[field] = 1;
      }
    }

    const orders = Orders.find(selector || {}, { fields }).fetch();

    const uniqueUserIds = {};
    for (const order of orders) {
      uniqueUserIds[order.userId] = 1;
    }
    const userFsi = getIdxFromFieldSetName('users', 'user-name');
    const orderedUsers = Meteor.call('users.adminGetByIdList', Object.keys(uniqueUserIds), userFsi);

    return {
      orders,
      orderedUsers,
    };
  },
  'orders.getById': (orderId, fieldSetIdx) => {
    const currentUserId = Meteor.userId();
    if (!currentUserId) { return { errors: '用户未登录' }; }

    const efs = getFieldSetFromIdx('orders', fieldSetIdx);
    const fields = { _id: 1 };
    if (efs) {
      for (const field of efs) {
        fields[field] = 1;
      }
    }

    // 只能获取当前用户的订单
    const order = Orders.findOne({
      _id: orderId,
      userId: currentUserId,
    }, { fields });

    return { order };
  },
  'orders.adminGetById': (orderId, fieldSetIdx) => {
    // 首先确保当前用户已经登录并且是管理员
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role < Consts.USER_ROLE_NORMAL)) { return { errors: '用户权限不足' }; }

    const efs = getFieldSetFromIdx('orders', fieldSetIdx);
    const fields = { _id: 1 };
    if (efs) {
      for (const field of efs) {
        fields[field] = 1;
      }
    }

    const order = Orders.findOne({
      _id: orderId,
    }, { fields });

    return { order };
  },
  // 修改订单状态
  'orders.edit': (data) => {
    // 首先确保当前用户已经登录并且是管理员
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role < Consts.USER_ROLE_NORMAL)) { return { errors: '用户权限不足' }; }

    // 我们目前并未进行防范恶意修改的验证, 毕竟需要管理员权限才能修改.
    data.status = parseInt(data.status);

    const order = {};
    const fields = ['status'];
    for (const k of fields) {
      if (data[k] !== undefined) {
        order[k] = data[k];
      }
    }

    // 修改指定订单
    Orders.update({
      _id: data._id
    }, {
      $set: order
    });

    // 返回更新后的订单
    const fsi = getIdxFromFieldSetName('orders', 'order-detail');
    return Meteor.call('orders.adminGetById', data._id, fsi);
  },
  // 订单创建可能成功或者失败.
  // 这个方法返回如下object给客户端:
  // {
  //   errors: 全局错误信息, 如果设置的话表示失败, 其它域都不设置
  //   order: 新创建的订单
  // }
  'orders.create': (order) => {
    const currentUser = Meteor.user();
    if (!currentUser) {
      return {
        errors: '未登录用户不能创建订单, 请登录!'
      };
    }

    let addr;
    if (order.addrId && currentUser.addr) {
      addr = currentUser.addr.find(elem => elem.id === order.addrId);
    }

    if (!addr) {
      if (currentUser.addr) {
        addr = currentUser.addr[0];
      }
      if (!addr) {
        return {
          errors: '没有合法的联系地址信息. 请指定联系地址或在用户设置中添加联系地址'
        };
      }
    }

    // 准备要插入的order
    const nowDate = new Date();
    const newOrder = {
      _id: generateOrderId(nowDate),
      userId: currentUser._id,
      createdAt: nowDate / 1,
      status: Consts.ORDER_STATUS_UNCLAIMED,
      sampleName: order.sampleName,
      sampleProducer: order.sampleProducer,
      producerBatch: order.producerBatch,
      sampleType: order.sampleType,
      sampleLevel: order.sampleLevel,
      sampleBrand: order.sampleBrand,
      sampleNum: order.sampleNum,
      clientName: order.clientName,
      clientContactAddress: addr,
      clientContactIdent: order.clientContactIdent,
      clientEconomicType: order.clientEconomicType,
      sampleDisposalType: order.sampleDisposalType,
      reportFetchingType: order.reportFetchingType,
      descImages: order.descImages
    };

    // validate失败时向client端返回errors
    // TODO: 解析错误信息
    res = schemaValidate('orderSchema', newOrder);
    if (res) {
      return {
        errors: '数据格式错误'
      };
    }

    // 没有问题就下单
    try {
      Orders.insert(newOrder);
    } catch (e) {
      return {
        errors: '订单创建失败'
      };
    }

    // 下单成功, 返回新创建的订单
    const fsi = getIdxFromFieldSetName('orders', 'order-list');
    return Meteor.call('orders.getById', newOrder._id, fsi);
  },
  'orders.pay': (data) => {
    const currentUser = Meteor.user();
    if (!currentUser) {
      return {
        errors: '用户未登录'
      };
    }

    const { orderId, method, pass } = data;
    if (!currentUser.ifPaymentPasswordSet) {
      return {
        errors: '支付密码未设置, 在支付前请先设置支付密码'
      };
    }

    let res = Accounts.verifyPaymentPassword(pass);
    if (res.error) {
      return {
        errors: '支付密码错误'
      };
    }

    if (orderId) {
      // 只能支付当前用户自己的订单
      const order = Orders.findOne({
        _id: orderId,
        userId: currentUser._id,
        status: Consts.ORDER_STATUS_APPROVED
      }, {
        fields: {
          approvedAt: 1,
          price: 1
        }
      });

      const now = new Date();
      if (order.approvedAt + paymentDeadlineAfterApproval * 3600 * 1000 < now) {
        Orders.update({
          _id: orderId
        }, {
          $set: {
            status: Consts.ORDER_STATUS_CLOSED
          }
        });
        return {
          errors: '订单已过期关闭'
        };
      }

      const amountStr = round2(order.price);
      if (method === 'a') {
        try {
          const paymentId = Payments.insert({
            userId: currentUser._id,
            type: 'P',
            method: Consts.PAYMENT_METHOD_ALIPAY,
            amount: amountStr,
            orderId,
            paid: false,
            createdAt: now / 1
          });

          const bizContent = JSON.stringify({
            subject: encodeURIComponent('国监订单付款'),
            out_trade_no: 'P_' + paymentId,
            timeout_express: '30m',
            total_amount: amountStr,
            product_code: 'QUICK_MSECURITY_PAY'
          });
          const notifyUrl = 'http://www.guojianzhijian.com/alipay/notify/';
          const timestamp = `${now.getFullYear()}-${('0' + (now.getMonth() + 1)).slice(-2)}-${('0' + now.getDate()).slice(-2)} ${('0' + now.getHours()).slice(-2)}:${('0' + now.getMinutes()).slice(-2)}:${('0' + now.getSeconds()).slice(-2)}`;  // eslint-disable-line

          const params = [];
          params.push(['app_id', alipayAppId]);
          params.push(['biz_content', bizContent]);
          params.push(['charset', 'utf-8']);
          params.push(['method', 'alipay.trade.app.pay']);
          params.push(['notify_url', notifyUrl]);
          params.push(['sign_type', 'RSA2']);
          params.push(['timestamp', timestamp]);
          params.push(['vertion', '1.0']);

          const queryStr = params.map(elem => elem.join('=')).join('&');
          const sign = crypto.createSign('sha256WithRSAEncryption');
          sign.update(queryStr);
          const signStr = sign.sign(alipayPrivateKey).toString('base64');

          params[1][1] = encodeURIComponent(params[1][1]);
          params[4][1] = encodeURIComponent(params[4][1]);
          params[6][1] = encodeURIComponent(params[6][1]);
          params.push(['sign', encodeURIComponent(signStr)]);
          const fullQueryStr = params.map(elem => elem.join('=')).join('&');

          return {
            queryStr: fullQueryStr
          };
        } catch(e) {
          return {
            errors: e.message
          };
        }
      } else {
        try {
          const historyEntry = {
            type: Consts.USER_HISTORY_TYPE_PAY,
            ts: now / 1,
            amount: -amount,
            orderId
          };

          const result = Users.update({
            _id: currentUser._id,
            balance: { $gt: amount-0.001 }
          }, {
            $inc: { balance: -amount },
            $push: {
              history: {
                $each: [historyEntry],
                $position: 0
              }
            }
          });

          if (result === 0) {
            return {
              errors: '扣款失败'
            };
          }
        } catch (e) {
          return {
            errors: '扣款失败'
          };
        }

        try {
          const result = Orders.update({
            _id: orderId,
            status: Consts.ORDER_STATUS_APPROVED
          }, { $set: {
            status: Consts.ORDER_STATUS_PAID,
            paidAt: now / 1
          } });

          if (result !== 1) {
            return {
              errors: '订单处理出错，请联系客服'
            };
          }
        } catch (e) {
          return {
            errors: '订单处理出错，请联系客服'
          };
        }

        const curUser = Meteor.user();
        const fsi = getIdxFromFieldSetName('orders', 'order-list');
        return {
          ...Meteor.call('orders.getById', orderId, fsi),
          amountPaid: amountStr,
          balance: round2(curUser.balance),
          history: curUser.history,
        };
      }
    }

    return {
      errors: '出错了'
    };
  },
  'orders.refund': (payload) => {
    const currentUserId = Meteor.userId();
    if (!currentUserId) {
      return {
        errors: '未登录用户不能申请退款, 请登录!'
      };
    }

    const { orderId, refundNotes } = payload;
    const order = Orders.findOne({ _id: orderId });
    if (!order) {
      return {
        errors: '订单不存在!'
      };
    }

    if (order.status !== Consts.ORDER_STATUS_PAID) {
      return {
        errors: '只有已支付的订单才能申请退款!'
      };
    }

    // 修改当前订单的状态
    const nowDate = new Date();
    const result = Orders.update({
      _id: orderId,
      status: Consts.ORDER_STATUS_PAID
    }, {
      $set: { status: Consts.ORDER_STATUS_REFUNDED },
      refundedAt: nowDate / 1,
      refundNotes
    });

    if (result === 0) {
      return {
        errors: '退款失败'
      };
    }

    // 给用户期折账户中加上`order.price`
    Users.update({
      _id: currentUserId
    }, {
      $inc: {
        balance: order.price
      },
      $push: {
        history: {
          $each: [{
            type: Consts.USER_HISTORY_TYPE_REFUND,
            ts: nowDate / 1,
            amount: order.price,
            orderId
          }],
          $position: 0
        }
      }
    });

    // 最后, 返回修改的订单和相关信息
    const curUser = Meteor.user();
    const fsi = getIdxFromFieldSetName('orders', 'order-detail');
    return {
      ...Meteor.call('orders.getById', orderId, fsi),
      balance: round(curUser.balance, 2),
      history: curUser.history,
    };
  }
});
