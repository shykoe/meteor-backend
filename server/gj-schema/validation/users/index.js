import Consts from 'gj-schema/consts';
import getClientSchema from './client';

export default function defineModel(sequelize, DataTypes) {
  const clientSchema = getClientSchema(DataTypes);

  const schema = {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    phone: clientSchema.phone,
    name: clientSchema.name,
    avatarImg: { type: DataTypes.BLOB },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: Consts.USER_LEVEL_NORMAL
    },
    balance: {
      type: DataTypes.FLOAT
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    }
    isPaymentPasswordSet: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    lastMsgReadTime: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    receiveMsgs: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    receiveInfo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  };

  const options = {
    timestamps: true,
    updatedAt: false,
    paranoid: true
  };

  return sequelize.define("users", schema, options);
}
