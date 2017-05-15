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
    phone: clientSchema.phone,
    province: clientSchema.province,
    city: clientSchema.city,
    district: clientSchema.district,
    street: clientSchema.street,
    zip: clientSchema.zip,
  };

  const options = {
    timestamps: true,
    updatedAt: false,
  };

  return sequelize.define("addrs", schema, options);
}
