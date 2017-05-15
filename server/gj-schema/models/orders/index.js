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
    status: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sampleName: clientSchema.sampleName,
    sampleProducer: clientSchema.producer,
    producerBatch: clientSchema.producerBatch,
    sampleType: clientSchema.sampleType,
    sampleLevel: clientSchema.sampleLevel,
    sampleBrand: clientSchema.sampleBrand,
    sampleNum: clientSchema.sampleNum,
    clientName: clientSchema.clientName,
    clientContactName: clientSchema.clientContactName,
    clientContactPhone: clientSchema.clientContactPhone,
    clientContactIdent: clientSchema.clientContactIdent,
    clientEconomicType: clientSchema.clientEconomicType,

    price: {
      type: DataTypes.FLOAT
    },
    deadline: {
      type: DataTypes.DATETIME
    },
    notes: {
      type: DataTypes.STRING
    }
  };

  const options = {
    timestamps: true,
    updatedAt: false,
    paranoid: true
  };

  return sequelize.define("orders", schema, options);
}
