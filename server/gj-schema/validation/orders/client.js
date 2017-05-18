export default function getClientSchema(DataTypes) {
  return {
    sampleName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sampleProducer: {
      type: DataTypes.STRING,
      allowNull: false
    },
    producerBatch: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sampleType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sampleLevel: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sampleBrand:  {
      type: DataTypes.STRING,
      allowNull: false
    },
    sampleNum: {
      type: DataTypes.STRING,
      allowNull: false
    },
    clientName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    clientContactName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    clientContactPhone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    clientContactIdent: {
      type: DataTypes.STRING,
      allowNull: false
    },
    clientEconomicType: {
      type: DataTypes.STRING,
      allowNull: false
    }
  };
}
