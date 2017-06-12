import Ajv from 'ajv';
import categorySchema from './validation/categories';
import feedbackSchema from './validation/feedbacks';
import metaSchema from './validation/meta';
import orderSchema from './validation/orders';
import paymentSchema from './validation/payments';
import rechargeSchema from './validation/recharges';
import reportSchema from './validation/reports';
import testerOpSchema from './validation/testerOps';
import userSchema from './validation/users';
import verificationSchema from './validation/verification';

const ajv = new Ajv({ allErrors: true });

function getValidateDict() {
  const validateDict = {};
  const schemaDict = {
    categorySchema,
    feedbackSchema,
    metaSchema,
    orderSchema,
    paymentSchema,
    rechargeSchema,
    reportSchema,
    testerOpSchema,
    userSchema,
    verificationSchema
  };

  for (const key in schemaDict) {
    if (key) {
      validateDict[key] = ajv.compile(schemaDict[key]);
    }
  }

  return validateDict;
}

const validateDict = getValidateDict();

export function schemaValidate(schema, data) {
  // `schema`是个字符串, schema object或者schema function, 如果是前者
  // 就从已定义的schema中选取对应的已编译好的schema function.
  let schemaFunc;
  if (typeof schema === 'string') {
    schemaFunc = validateDict[schema];
  } else if (typeof schema === 'function') {
    schemaFunc = schema;
  } else {
    schemaFunc = ajv.compile(schema);
  }
  const valid = schemaFunc(data);

  if (!valid) {
    return schemaFunc.errors;
  }

  return null;
}
