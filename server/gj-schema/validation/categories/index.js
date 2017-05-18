import getClientSchema from './client';

export default function defineModel(sequelize, DataTypes) {
  const clientSchema = getClientSchema(DataTypes);

  const schema = {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: clientSchema.name,
  };

  const options = {
    timestamps: true,
    updatedAt: false,
    paranoid: true
  };

  return sequelize.define("categories", schema, options);
}
