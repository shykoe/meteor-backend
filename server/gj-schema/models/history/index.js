export default function defineModel(sequelize, DataTypes) {
  const schema = {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    orderId: {
      type: DataTypes.Integer,
      allowNull: false,
    },
    outTradeNo: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  };

  const options = {
    timestamps: true,
    updatedAt: false,
    paranoid: true,
    freezeTableName: true,
  };

  return sequelize.define("history", schema, options);
}
