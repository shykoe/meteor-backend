import { SMS } from 'yunpian-sdk';

export function sendVerificationCode(phoneNumber, verificationCode) {
  const sms = new SMS({
    apikey: 'apikey'
  });

  async function send() {
    return await sms.singleSend({
      mobile: phoneNumber,
      text: '【国监】欢迎使用国监App，您的手机验证码是' + verificationCode + '。'
    });
  };

  return send().then(res => ({
    code: res.code,
    errors: res.msg
  }));
}
