import { SMS } from 'yunpian-sdk';

export function sendVerificationCode(phoneNumber, verificationCode) {
  const sms = new SMS({
    apikey: 'c511ebd1565da2da13fc5d428012aa46 '
  });

  async function send() {
    return await sms.singleSend({
      mobile: phoneNumber,
      text: '【菲尔兹网络】欢迎使用期折优会，您的手机验证码是' + verificationCode + '。'
    });
  };

  return send().then(res => ({
    code: res.code,
    errors: res.msg
  }));
}
