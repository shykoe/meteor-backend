import Consts from 'gj-schema/consts';
import getClientSchema from './client';

export default function defineModel(sequelize, DataTypes) {
  const clientSchema = getClientSchema(DataTypes);

  const schema = {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    }
  };

  const options = {
    timestamps: true,
    paranoid: true
  };

  return sequelize.define("testerOps", schema, options);
}
