export default function setupRelations(db) {
  db.addrs.belongsTo(db.users, { foreignKey: 'userId' });
  db.users.hasMany(db.addrs, { foreignKey: 'userId' });

  db.history.belongsTo(db.users, { foreignKey: 'userId' });
  db.users.hasMany(db.history, { foreignKey: 'userId' });

  db.orders.belongsTo(db.users, { foreignKey: 'userId' });
  db.users.hasMany(db.orders, { foreignKey: 'userId' });

  db.recharges.belongsTo(db.users, { foreignKey: 'userId' });
  db.users.hasMany(db.recharges, { foreignKey: 'userId' });

  db.testerOps.belongsTo(db.users, { foreignKey: 'userId' });
  db.users.hasMany(db.testerOps, { foreignKey: 'userId' });

  db.testItems.belongsTo(db.categories, { foreignKey: 'categoryId' });
  db.categories.hasMany(db.testItems, { foreignKey: 'categoryId' });

  db.orders.belongsTo(db.categories, { foreignKey: 'sampleCategoryId' });
  db.categories.hasMany(db.orders, { foreignKey: 'sampleCategoryId' });

  db.orders.belongsTo(db.addrs, { foreignKey: 'clientContactAddrId' });
  db.addrs.hasMany(db.orders, { foreignKey: 'clientContactAddrId' });

  db.orderItems.belongsTo(db.orders, { foreignKey: 'orderId' });
  db.orders.hasMany(db.orderItems, { foreignKey: 'orderId' });

  db.orderItems.belongsTo(db.testItems, { foreignKey: 'testItemId' });
  db.testItems.hasMany(db.orderItems, { foreignKey: 'testItemId' });

  db.orderImages.belongsTo(db.orders, { foreignKey: 'orderId' });
  db.orders.hasMany(db.orderImages, { foreignKey: 'orderId' });
};
