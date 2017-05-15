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
    level: clientSchema.level,
    serial: clientSchema.serial,
    name: clientSchema.name,
    requirement: clientSchema.requirement,
    standard: clientSchema.standard
  };

  const options = {
    timestamps: true,
    updatedAt: false,
    paranoid: true
  };

  return sequelize.define("testItems", schema, options);
}
