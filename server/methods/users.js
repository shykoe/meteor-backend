import crypto from 'crypto';
import Consts from '/server/pr-schema/consts';
import Users from '/server/pr-schema/models/users';
import Verification from '/server/pr-schema/models/verification';
import Recharges from '/server/pr-schema/models/recharges';
import Payments from '/server/pr-schema/models/payments';
import Orders from '/server/pr-schema/models/orders';
import userSchema from '/server/pr-schema/validation/users';
import { schemaValidate } from '/server/pr-schema/validate';
import { getRandomInt, round2 } from '/server/kh-helpers/math';
import {
  alipayAppId,
  alipaySellerId,
  alipayPrivateKey,
  alipayPlatformPublicKey
} from '/server/config';
import { getFieldSetFromIdx, getIdxFromFieldSetName } from '/server/pr-schema/dataman-utils';

// 可以使用`setProfileAttr`方法设置的profile attr列表
const editableAttrs = {
  receiveMsgs: 1,
  receiveInfo: 1,
};

// 随机生成一个8位数字加上'user'前缀构成一个默认的用户名
function generateUserName() {
  let token = '';
  for (let i = 0; i < 8; i++) {
    token += getRandomInt(0, 9);
  }
  return `user${token}`;
}

function generateMessage(currentUserId, eventType) {
  Users.update({
    _id: currentUserId
  }, {
    $push: {
      extraEvents: {
        $each: [{
          type: eventType,
          ts: new Date() / 1
        }],
        $position: 0
      }
    }
  });
}

// 各个数据域的赋值
Accounts.onCreateUser((options, user) => {
  user.ifPaymentPasswordSet = options.ifPaymentPasswordSet;
  user.role = Consts.USER_ROLE_NORMAL;
  user.balance = 0;
  user.addr = [];
  user.history = [];
  user.extraEvents = [];
  user.lastMessageEnterTime = options.lastMessageEnterTime;

  return user;
});

Meteor.methods({
  'users.adminGetByIdList': (userIds, fieldSetIdx) => {
    // 首先确保当前用户已经登录并且是管理员
    const currentUser = Meteor.user();
    if (!currentUser) { return { errors: '用户未登录' }; }
    if (!(currentUser.role <= Consts.USER_ROLE_AGENT)) { return { errors: '用户权限不足' }; }

    const efs = getFieldSetFromIdx('users', fieldSetIdx);
    const fields = { _id: 1 };
    if (efs) {
      for (const field of efs) {
        fields[field] = 1;
      }
    }

    const users = Users.find({
      _id: { $in: userIds }
    }, { fields }).fetch();

    return users;
  },
  'users.getCurrent': (fieldSetIdx) => {
    const currentUserId = Meteor.userId();
    if (!currentUserId) { return { errors: '用户未登录' }; }

    const efs = getFieldSetFromIdx('users', fieldSetIdx);
    const fields = { _id: 1 };
    if (efs) {
      for (const field of efs) {
        fields[field] = 1;
      }
    }

    const currentUser = Users.findOne({
      _id: currentUserId
    }, { fields });

    return currentUser;
  },
  'users.create': (options) => {
    // 首先进行简单的数据验证
    const errors = {};
    if (options.password !== options.confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致';
      return { errors };
    }

    if (typeof options.password !== 'string' || options.password.length < 6) {
      errors.password = '密码长度不能小于6位';
      return { errors };
    }

    if (typeof options.verificationCode !== 'string' ||
        options.verificationCode.length !== 6) {
      errors.verificationCode = '错误的验证码';
      return { errors };
    }

    const nowDate = new Date();
    const v = Verification.findOne({ phone: options.phone });
    if (!v || v.code !== options.verificationCode) {
      errors.verificationCode = '错误的验证码';
      return { errors };
    }
    if (nowDate - v.ts > 900000) {
      errors.verificationCode = '验证码已过期';
      return { errors };
    }

    const user = {
      phone: options.phone,
      username: generateUserName(),
      ifPaymentPasswordSet: false,
      password: options.password,
      createdAt: nowDate / 1,
      role: Consts.USER_ROLE_NORMAL,
      balance: 0,
      addr: [],
      history: [],
      extraEvents: [],
      lastMessageEnterTime: nowDate / 1
    };

    // validate失败时向client端返回errors
    const res = schemaValidate('userSchema', user);
    if (res) {
      errors._error = '数据格式错误';
      return { errors };
    }

    // 如果失败则重试, 最多3次.
    // TODO: 完善这个逻辑, 包括判断失败的原因是username重了还是其它原因.
    let done = false;
    for (let i = 0; i < 3; i++) {
      try {
        Accounts.createUser(user);
      } catch (e) {
        user.username = generateUserName();
        continue;
      }

      done = true;
      break;
    }

    if (!done) {
      errors._error = '注册失败';
      return { errors };
    }

    return {};
  },
  'users.setInitialPaymentPassword': (password, verificationCode) => {
    // 首先验证验证码的正确性
    if (typeof verificationCode !== 'string' || verificationCode.length !== 6) {
      return {
        errors: '错误的验证码'
      };
    }

    if (typeof password !== 'string' || password.length !== 6) {
      return {
        errors: '支付密码格式不对'
      };
    }

    const currentUser = Meteor.user();
    if (!currentUser) {
      return {
        errors: '用户未登录'
      };
    }

    const v = Verification.findOne({ phone: currentUser.phone });
    if (!v || v.code !== verificationCode) {
      return {
        errors: '错误的验证码'
      };
    }
    if (new Date() - v.ts > 900000) {
      return {
        errors: '验证码已过期'
      };
    }

    try {
      Meteor.call('setInitialPaymentPassword', password);
      generateMessage(currentUser._id, Consts.USER_EXTRA_TYPE_SET_PAYMENT_PASSWORD);
    } catch (e) {
      return {
        errors: e.message
      };
    }

    const fsi = getIdxFromFieldSetName('users', 'user-minimum');
    return Meteor.call('users.getCurrent', fsi);
  },
  'users.changePaymentPassword': (oldPassword, newPassword, verificationCode) => {
    // 首先验证验证码的正确性
    if (typeof verificationCode !== 'string' || verificationCode.length !== 6) {
      return {
        errors: '错误的验证码'
      };
    }

    if (typeof newPassword !== 'string' || newPassword.length !== 6) {
      return {
        errors: '新的支付密码格式不对'
      };
    }

    const currentUser = Meteor.user();
    if (!currentUser) {
      return {
        errors: '用户未登录'
      };
    }

    const v = Verification.findOne({ phone: currentUser.phone });
    if (!v || v.code !== verificationCode) {
      return {
        errors: '错误的验证码'
      };
    }
    if (new Date() - v.ts > 900000) {
      return {
        errors: '验证码已过期'
      };
    }

    try {
      Meteor.call('changePaymentPassword', oldPassword, newPassword);
      generateMessage(currentUser._id, Consts.USER_EXTRA_TYPE_CHANGE_PAYMENT_PASSWORD);
    } catch (e) {
      return {
        errors: e.message
      };
    }

    return {
      passwordChanged: true
    };
  },
  'users.resetPassword': (data) => {
    const errors = {};

    if (data.password !== data.confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致';
      return { errors };
    }

    if (typeof data.password !== 'string' || data.password.length < 6) {
      errors.password = '密码长度不能小于6位';
      return { errors };
    }

    // 首先验证验证码的正确性
    if (typeof data.verificationCode !== 'string' || data.verificationCode.length !== 6) {
      errors.verificationCode = '错误的验证码';
      return { errors };
    }

    const v = Verification.findOne({ phone: data.phone });
    if (!v || v.code !== data.verificationCode) {
      errors.verificationCode = '错误的验证码';
      return { errors };
    }
    if (new Date() - v.ts > 900000) {
      errors.verificationCode = '验证码已过期';
      return { errors };
    }

    try {
      Accounts.resetPassword2(data.phone, data.password);
      generateMessage(Meteor.userId(), Consts.USER_EXTRA_TYPE_CHANGE_LOGIN_PASSWORD);
    } catch (e) {
      errors._error = e.message;
      return { errors };
    }

    return {
      passwordChanged: true
    };
  },
  'users.alipayConfirmPayment': (body) => {
    const sign = body.sign;
    delete body.sign;
    delete body.sign_type;

    const paramArr = Object.entries(body);
    paramArr.sort((a, b) => a[0].localeCompare(b[0]));

    const paramStr = paramArr.map(elem => elem[0] + '=' + decodeURIComponent(elem[1])).join('&');
    const verify = crypto.createVerify('sha256WithRSAEncryption');
    verify.update(paramStr, 'utf8');
    if (verify.verify(alipayPlatformPublicKey, sign, 'base64')) {
      if (body.out_trade_no[0] === 'R') {
        const recharge = Recharges.findOne({ _id: body.out_trade_no.slice(2) });
        if (recharge) {
          if (!recharge.paid) {
            if (recharge.method === Consts.PAYMENT_METHOD_ALIPAY &&
                (body.trade_status === 'TRADE_SUCCESS' || body.trade_status === 'TRADE_FINISHED') &&
                body.app_id === alipayAppId &&
                body.seller_id === alipaySellerId &&
                body.total_amount === recharge.amount) {
              const docs = Recharges.update({
                _id: recharge._id,
                paid: false
              }, {
                $set: {
                  paid: true,
                  tradeNo: body.trade_no
                }
              });

              if (docs) {
                try {
                  const amount = parseFloat(recharge.amount);
                  const result = Users.update({
                    _id: recharge.userId
                  }, {
                    $inc: { balance: amount },
                    $push: {
                      history: {
                        $each: [{
                          type: Consts.USER_HISTORY_TYPE_ADD_FUNDS,
                          amount,
                          ts: recharge.createdAt,
                          outTradeNo: body.out_trade_no
                        }],
                        $position: 0
                      }
                    }
                  });

                  if (result === 0) {
                    console.log('充值处理出错');
                    return;
                  }
                } catch (e) {
                  console.log('充值处理出错');
                  return;
                }

                console.log('1. Async R');
              } else {
                console.log('2. Async R');
              }
            } else {
              console.log('订单信息不符');
              return;
            }
          } else {
            console.log('2. Async R');
          }
        } else {
          console.log('未找到对应的订单');
          return;
        }
      } else {
        const payment = Payments.findOne({ _id: body.out_trade_no.slice(2) });
        if (payment) {
          if (!payment.paid) {
            if (payment.method === Consts.PAYMENT_METHOD_ALIPAY &&
                (body.trade_status === 'TRADE_SUCCESS' || body.trade_status === 'TRADE_FINISHED') &&
                body.app_id === alipayAppId &&
                body.seller_id === alipaySellerId &&
                body.total_amount === payment.amount &&
                body.out_trade_no[0] === payment.type) {
              const docs = Payments.update({
                _id: payment._id,
                paid: false
              }, {
                $set: {
                  paid: true,
                  tradeNo: body.trade_no
                }
              });

              if (docs) {
                try {
                  const amount = parseFloat(payment.amount);
                  const historyEntry = {
                    type: Consts.USER_HISTORY_TYPE_PAY,
                    amount: -amount,
                    orderId: payment.orderId,
                    ts: payment.createdAt,
                    outTradeNo: body.out_trade_no
                  };

                  let result;
                  try {
                    result = Users.update({
                      _id: payment.userId
                    }, {
                      $push: {
                        history: {
                          $each: [historyEntry],
                          $position: 0
                        }
                      }
                    });

                    if (result === 0) {
                      console.log('支付处理出错');
                      return;
                    }
                  } catch (e) {
                    console.log('支付处理出错');
                    return;
                  }

                  try {
                    result = Orders.update({
                      _id: payment.orderId
                    }, { $set: {
                      status: Consts.ORDER_STATUS_PAID,
                      paidAt: payment.createdAt
                    } });

                    if (result === 0) {
                      console.log('订单处理出错');
                      return;
                    }
                  } catch (e) {
                    console.log('订单处理出错');
                    return;
                  }
                } catch (e) {
                  console.log('支付处理出错');
                  return;
                }

                console.log('1. Async ' + payment.type);
              } else {
                console.log('2. Async ' + payment.type);
              }
            } else {
              console.log('订单信息不符');
              return;
            }
          } else {
            console.log('2. Async ' + payment.type);
          }
        } else {
          console.log('未找到对应的订单');
          return;
        }
      }
    } else {
      console.log('支付结果验证失败');
      return;
    }
  },
  'users.alipayProcPayment': (resultStr) => {
    const resultObj = JSON.parse(resultStr);
    const resultParams = resultObj.alipay_trade_app_pay_response;
    const verify = crypto.createVerify('sha256WithRSAEncryption');
    verify.update(JSON.stringify(resultParams), 'utf8');
    if (verify.verify(alipayPlatformPublicKey, resultObj.sign, 'base64')) {
      if (resultParams.out_trade_no[0] === 'R') {
        const recharge = Recharges.findOne({ _id: resultParams.out_trade_no.slice(2) });
        if (recharge) {
          if (!recharge.paid) {
            if (recharge.method === Consts.PAYMENT_METHOD_ALIPAY &&
                resultParams.msg === 'Success' &&
                resultParams.app_id === alipayAppId &&
                resultParams.seller_id === alipaySellerId &&
                resultParams.total_amount === recharge.amount) {
              const docs = Recharges.update({
                _id: recharge._id,
                paid: false
              }, {
                $set: {
                  paid: true,
                  tradeNo: resultParams.trade_no
                }
              });

              if (docs) {
                try {
                  const amount = parseFloat(recharge.amount);
                  const result = Users.update({
                    _id: recharge.userId
                  }, {
                    $inc: { balance: amount },
                    $push: {
                      history: {
                        $each: [{
                          type: Consts.USER_HISTORY_TYPE_ADD_FUNDS,
                          amount,
                          ts: recharge.createdAt,
                          outTradeNo: resultParams.out_trade_no
                        }],
                        $position: 0
                      }
                    }
                  });

                  if (result === 0) {
                    return {
                      errors: '充值处理出错，请联系客服'
                    };
                  }
                } catch (e) {
                  return {
                    errors: '充值处理出错，请联系客服'
                  };
                }

                console.log('1. Sync R');
              } else {
                console.log('2. Sync R');
              }
            } else {
              return {
                errors: '订单信息不符, 请联系客服'
              };
            }
          } else {
            console.log('2. Sync R');
          }
        } else {
          return {
            errors: '未找到对应的订单, 请联系客服'
          };
        }

        const fsi = getIdxFromFieldSetName('users', 'user-placeOrder');
        return Meteor.call('users.getCurrent', fsi);
      } else {
        const payment = Payments.findOne({ _id: resultParams.out_trade_no.slice(2) });
        if (payment) {
          if (!payment.paid) {
            if (payment.method === Consts.PAYMENT_METHOD_ALIPAY &&
                resultParams.msg === 'Success' &&
                resultParams.app_id === alipayAppId &&
                resultParams.seller_id === alipaySellerId &&
                resultParams.total_amount === payment.amount &&
                resultParams.out_trade_no[0] === payment.type) {
              const docs = Payments.update({
                _id: payment._id,
                paid: false
              }, {
                $set: {
                  paid: true,
                  tradeNo: resultParams.trade_no
                }
              });

              if (docs) {
                try {
                  const amount = parseFloat(payment.amount);
                  const historyEntry = {
                    type: Consts.USER_HISTORY_TYPE_PAY,
                    amount: -amount,
                    orderId: payment.orderId,
                    ts: payment.createdAt,
                    outTradeNo: resultParams.out_trade_no
                  };

                  let result;
                  try {
                    result = Users.update({
                      _id: payment.userId
                    }, {
                      $push: {
                        history: {
                          $each: [historyEntry],
                          $position: 0
                        }
                      }
                    });

                    if (result === 0) {
                      return {
                        errors: '支付处理出错，请联系客服'
                      };
                    }
                  } catch (e) {
                    return {
                      errors: '支付处理出错，请联系客服'
                    };
                  }

                  try {
                    result = Orders.update({
                      _id: payment.orderId
                    }, { $set: {
                      status: Consts.ORDER_STATUS_PAID,
                      paidAt: payment.createdAt
                    } });

                    if (result === 0) {
                      return {
                        errors: '订单处理出错，请联系客服'
                      };
                    }
                  } catch (e) {
                    return {
                      errors: '订单处理出错，请联系客服'
                    };
                  }
                } catch (e) {
                  return {
                    errors: '支付处理出错，请联系客服'
                  };
                }

                console.log('1. Sync ' + payment.type);
              } else {
                console.log('2. Sync ' + payment.type);
              }
            } else {
              return {
                errors: '订单信息不符, 请联系客服'
              };
            }
          } else {
            console.log('2. Sync ' + payment.type);
          }
        } else {
          return {
            errors: '未找到对应的订单, 请联系客服'
          };
        }

        const currentUser = Users.findOne({
          _id: payment.userId
        }, { fields: {
          history: 1
        } });

        if (!currentUser) {
          return {
            errors: '找不到用户'
          };
        }

        const fsi = getIdxFromFieldSetName('orders', 'order-list');
        return {
          ...Meteor.call('orders.getById', payment.orderId, fsi),
          amountPaid: round2(payment.amount),
          history: currentUser.history,
        };
      }
    } else {
      return {
        errors: '支付结果验证失败'
      };
    }
  },
  'users.alipayRechargeInit': (rechargeAmount, pass) => {
    const currentUser = Meteor.user();
    if (!currentUser) {
      return {
        errors: '用户未登录'
      };
    }

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

    const amount = round2(parseFloat(rechargeAmount));
    if (amount > 0) {
      try {
        const now = new Date();
        const rechargeId = Recharges.insert({
          userId: currentUser._id,
          method: Consts.PAYMENT_METHOD_ALIPAY,
          amount,
          paid: false,
          createdAt: now / 1
        });

        const bizContent = JSON.stringify({
          subject: encodeURIComponent('国监账户充值'),
          out_trade_no: 'R_' + rechargeId,
          timeout_express: '30m',
          total_amount: amount,
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
      return {
        errors: '充值金额格式错误'
      };
    }
  },
  'users.addAddress': (addrObj) => {
    const currentUserId = Meteor.userId();
    if (!currentUserId) {
      return {
        errors: '用户未登录'
      };
    }

    const newAddr = {
      id: Random.id(),
      name: addrObj.name,
      tel: addrObj.tel,
      province: addrObj.province,
      city: addrObj.city,
      district: addrObj.district,
      street: addrObj.street
    };

    if (addrObj.setDefault) {
      Users.update({
        _id: currentUserId
      }, { $push: { addr: { $each: [newAddr], $position: 0 } } });
      generateMessage(currentUserId, Consts.USER_EXTRA_TYPE_SET_DEFAULT_ADDRESS);
    } else {
      Users.update({
        _id: currentUserId
      }, { $push: { addr: newAddr } });
      generateMessage(currentUserId, Consts.USER_EXTRA_TYPE_ADD_NEW_ADDRESS);
    }

    const fsi = getIdxFromFieldSetName('users', 'user-addr');
    return Meteor.call('users.getCurrent', fsi);
  },
  'users.editAddress': (addrObj) => {
    const currentUserId = Meteor.userId();
    if (!currentUserId) {
      return {
        errors: '用户未登录'
      };
    }

    const newAddr = {
      id: addrObj.id,
      name: addrObj.name,
      tel: addrObj.tel,
      province: addrObj.province,
      city: addrObj.city,
      district: addrObj.district,
      street: addrObj.street
    };

    if (addrObj.setDefault) {
      // 先移除再添加
      Users.update({
        _id: currentUserId,
      }, {
        $pull: {
          addr: {
            id: addrObj.id
          }
        }
      });
      Users.update({
        _id: currentUserId
      }, { $push: { addr: { $each: [newAddr], $position: 0 } } });
      generateMessage(currentUserId, Consts.USER_EXTRA_TYPE_CHANGE_SET_DEFAULT_ADDRESS);
    } else {
      Users.update({
        _id: currentUserId,
        'addr.id': addrObj.id,
      }, { $set: { 'addr.$': newAddr } });
      generateMessage(currentUserId, Consts.USER_EXTRA_TYPE_CHANGE_ADDRESS);
    }

    const fsi = getIdxFromFieldSetName('users', 'user-addr');
    return Meteor.call('users.getCurrent', fsi);
  },
  'users.setDefaultAddress': (addrId) => {
    const currentUser = Meteor.user();
    if (!currentUser) {
      return {
        errors: '用户未登录'
      };
    }

    // 先获取这个地址
    const addrObj = currentUser.addr.find(elem => elem.id === addrId);

    if (!addrObj) {
      return {
        errors: '地址不存在'
      };
    }

    // 先移除再添加
    Users.update({
      _id: currentUser._id,
    }, {
      $pull: {
        addr: {
          id: addrObj.id
        }
      }
    });
    Users.update({
      _id: currentUser._id
    }, { $push: { addr: { $each: [addrObj], $position: 0 } } });
    generateMessage(currentUser._id, Consts.USER_EXTRA_TYPE_SET_DEFAULT_ADDRESS);

    const fsi = getIdxFromFieldSetName('users', 'user-addr');
    return Meteor.call('users.getCurrent', fsi);
  },
  'users.removeAddress': (addrId) => {
    const currentUserId = Meteor.userId();
    if (!currentUserId) {
      return {
        errors: '用户未登录'
      };
    }

    Users.update({
      _id: currentUserId,
    }, {
      $pull: {
        addr: {
          id: addrId
        }
      }
    });
    generateMessage(currentUserId, Consts.USER_EXTRA_TYPE_REMOVE_ADDRESS);

    const fsi = getIdxFromFieldSetName('users', 'user-addr');
    return Meteor.call('users.getCurrent', fsi);
  },
  'users.setAccountAvatarImg': (avatarImg) => {
    const currentUserId = Meteor.userId();
    if (!currentUserId) {
      return {
        errors: '用户未登录'
      };
    }

    Users.update({
      _id: currentUserId
    }, { $set: { avatarImg } });
    generateMessage(currentUserId, Consts.USER_EXTRA_TYPE_SET_AVATAR);

    const fsi = getIdxFromFieldSetName('users', 'user-minimum');
    return Meteor.call('users.getCurrent', fsi);
  },
  'users.setProfileAttr': (attr, val) => {
    const currentUserId = Meteor.userId();
    if (!currentUserId) {
      return {
        errors: '用户未登录'
      };
    }

    // 先确认这确实是合法的可以用这个method设置的attr
    if (!editableAttrs[attr]) {
      return {
        errors: '错误的参数'
      };
    }

    // 然后验证传入的值是否符合schema
    const attrSchema = userSchema.properties[attr];
    const res = schemaValidate(attrSchema, val);
    if (res) {
      return {
        errors: '非法的数据'
      };
    }

    Users.update({
      _id: currentUserId
    }, { $set: { [attr]: val } });

    generateMessage(currentUserId, Consts.USER_EXTRA_TYPE_ACCOUNT_SETTING);

    const fsi = getIdxFromFieldSetName('users', 'user-common');
    return Meteor.call('users.getCurrent', fsi);
  },
  'users.updateLastMessageEnterTime': () => {
    const currentUserId = Meteor.userId();
    if (!currentUserId) {
      return { errors: '用户没有登录，请重新登录' };
    }
    try {
      Users.update({
        _id: currentUserId
      }, { $set: { lastMessageEnterTime: new Date() / 1 } });
    } catch (exception) {
      return { errors: exception.message };
    }

    const fsi = getIdxFromFieldSetName('users', 'user-msgLastEnter');
    return Meteor.call('users.getCurrent', fsi);
  }
});
