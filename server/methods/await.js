import Verification from '/server/gj-schema/models/verification';
import { sendVerificationCode } from '/server/kh-helpers/3rd-party/sms';
import { getRandomInt } from '/server/kh-helpers/math';

function callMeteorMethod(methodName, ...args) {
  return new Promise((resolve, reject) => {
    Meteor.call(methodName, ...args, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
}

Meteor.methods({
  'getVerificationCode': (phoneNumber) => {
    const nowDate = new Date();

    // 首先看看这个电话号码60秒内是否已经发送过
    const entry = Verification.findOne({
      phone: phoneNumber
    });

    // 实际判断用55秒来补偿网络延时带来的误差
    if (entry && (nowDate - entry.ts) < 55000) {
      return null;
    }

    const verificationCode = String(getRandomInt(100000, 999999));

    Verification.update({
      phone: phoneNumber
    }, {
      phone: phoneNumber,
      code: verificationCode,
      ts: nowDate
    }, {
      upsert: true
    });

    return verificationCode;
  },
  'users.sendVerificationCode': async (phoneNumber) => {
    if (!phoneNumber) {
      const currentUser = Meteor.user();
      if (currentUser) {
        phoneNumber = currentUser.phone;
      } else {
        return {
          errors: '用户未登录'
        };
      }
    }

    const verificationCode = await callMeteorMethod('getVerificationCode', phoneNumber);
    if (verificationCode) {
      const res = await sendVerificationCode(phoneNumber, verificationCode);
      return res;
    } else {
      return {
        errors: '两次发送间隔不足60秒'
      };
    }
  },
});
