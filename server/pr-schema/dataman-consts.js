export const fields = Object.freeze({
  users: [
    ['phone', 60],
    ['username', 60],
    ['emails', 60],
    ['createdAt', 60],
    ['name', 60],
    ['avatarImg', 60],
    ['role', 60],
    ['balance', 60],
    ['ifPaymentPasswordSet', 60],
    ['isPasswordRst', 60],
    ['addr', 60],
    ['history', 60],
    ['extraEvents', 60],
    ['lastMessageEnterTime', 60],
    ['receiveMsgs', 60],
    ['receiveInfo', 60],
  ],
  categories: [
    ['_', 60],
    ['name', 60],
    ['levels', 60],
  ],
  orders: [
    ['_', 60],
    ['userId', 60],
    ['status', 60],
    ['createdAt', 60],
    ['approvedAt', 60],
    ['rejectedAt', 60],
    ['paidAt', 60],
    ['refundedAt', 60],
    ['sampleName', 60],
    ['sampleProducer', 60],
    ['producerBatch', 60],
    ['sampleType', 60],
    ['sampleLevel', 60],
    ['sampleBrand', 60],
    ['sampleNum', 60],
    ['clientName', 60],
    ['clientContactAddress', 60],
    ['clientContactIdent', 60],
    ['clientEconomicType', 60],
    ['sampleDisposalType', 60],
    ['reportFetchingType', 60],
    ['descImages', 60],
    ['reportNo', 60],
    ['categoryName', 60],
    ['levelName', 60],
    ['items', 60],
    ['activeCustServRequest', 60],
    ['custServHistory', 60],
    ['price', 60],
    ['deadline', 60],
    ['notes', 60],
    ['agentId', 60],
    ['testerIds', 60],
    ['agentMsg', 60],
    ['keeperMsg', 60],
    ['ShippingInfo', 60],
    ['sampleImages', 60],
    ['testingImages', 60],
    ['refundNotes', 60],
  ],
  feedbacks: [
    ['_', 60],
    ['userId', 60],
    ['phone', 60],
    ['content', 60],
    ['isProcessed', 60],
    ['procNotes', 60],
    ['createdAt', 60],
  ]
});

export const fieldSets = Object.freeze({
  users: [
    [
      'user-name',
      ['username']
    ],
    [
      'user-balance',
      ['balance']
    ],
    [
      'user-addr',
      ['addr']
    ],
    [
      'user-msgLastEnter',
      ['lastMessageEnterTime']
    ],
    [
      'user-messages',
      ['history', 'extraEvents', 'lastMessageEnterTime']
    ],
    [
      'user-placeOrder',
      ['balance', 'history']
    ],
    [
      'user-login',
      ['phone', 'username', 'role']
    ],
    [
      'user-minimum',
      ['phone', 'username', 'name', 'avatarImg', 'role', 'balance', 'ifPaymentPasswordSet',
       'isPasswordRst']
    ],
    [
      'user-common',
      ['phone', 'username', 'emails', 'createdAt', 'name', 'avatarImg', 'role', 'balance',
       'ifPaymentPasswordSet', 'isPasswordRst', 'addr', 'history', 'extraEvents',
       'lastMessageEnterTime', 'receiveMsgs', 'receiveInfo']
    ],
  ],
  categories: [
    [
      'category-list',
      ['name', 'levels']
    ],
  ],
  orders: [
    [
      'order-list',
      ['userId', 'status', 'createdAt', 'approvedAt', 'rejectedAt', 'paidAt', 'refundedAt',
       'sampleName', 'sampleProducer', 'producerBatch', 'sampleType', 'sampleLevel', 'sampleBrand',
       'sampleNum', 'clientName', 'clientContactAddress', 'clientContactIdent',
       'clientEconomicType', 'sampleDisposalType', 'reportFetchingType', 'reportNo', 'categoryName',
       'levelName', 'items', 'activeCustServRequest', 'custServHistory', 'price', 'deadline',
       'notes', 'ShippingInfo', 'refundNotes']
    ],
    [
      'order-detail',
      ['userId', 'status', 'createdAt', 'approvedAt', 'rejectedAt', 'paidAt', 'refundedAt',
       'sampleName', 'sampleProducer', 'producerBatch', 'sampleType', 'sampleLevel', 'sampleBrand',
       'sampleNum', 'clientName', 'clientContactAddress', 'clientContactIdent',
       'clientEconomicType', 'sampleDisposalType', 'reportFetchingType', 'descImages', 'reportNo',
       'categoryName', 'levelName', 'items', 'activeCustServRequest', 'custServHistory', 'price',
       'deadline', 'notes', 'ShippingInfo', 'refundNotes', 'sampleImages', 'testingImages']
    ],
    [
      'order-cust-serv-add',
      'activeCustServRequest'
    ],
    [
      'order-adminList',
      ['userId', 'status', 'createdAt', 'approvedAt', 'rejectedAt', 'paidAt', 'refundedAt',
       'sampleName', 'sampleProducer', 'producerBatch', 'sampleType', 'sampleLevel', 'sampleBrand',
       'sampleNum', 'clientName', 'clientContactAddress', 'clientContactIdent',
       'clientEconomicType', 'sampleDisposalType', 'reportFetchingType', 'reportNo', 'categoryName',
       'levelName', 'items', 'activeCustServRequest', 'custServHistory', 'price', 'deadline',
       'notes', 'ShippingInfo', 'refundNotes', 'agentId', 'testerIds', 'agentMsg', 'keeperMsg']
    ],
    [
      'order-adminDetail',
      ['userId', 'status', 'createdAt', 'approvedAt', 'rejectedAt', 'paidAt', 'refundedAt',
       'sampleName', 'sampleProducer', 'producerBatch', 'sampleType', 'sampleLevel', 'sampleBrand',
       'sampleNum', 'clientName', 'clientContactAddress', 'clientContactIdent',
       'clientEconomicType', 'sampleDisposalType', 'reportFetchingType', 'descImages', 'reportNo',
       'categoryName', 'levelName', 'items', 'activeCustServRequest', 'custServHistory', 'price',
       'deadline', 'notes', 'ShippingInfo', 'refundNotes', 'agentId', 'testerIds', 'agentMsg',
       'keeperMsg', 'sampleImages', 'testingImages']
    ]
  ],
  feedbacks: [
    [
      'feedback-admin',
      ['userId', 'phone', 'content', 'isProcessed', 'procNotes', 'createdAt']
    ],
  ],
});
