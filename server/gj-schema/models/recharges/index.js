import Consts from 'gj-schema/consts';

export default function defineModel(sequelize, DataTypes) {
  const schema = {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    method: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    paid: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    tradeNo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    }
  };

  const options = {
    timestamps: true,
    updatedAt: false,
    paranoid: true
  };

  return sequelize.define("recharges", schema, options);
}
