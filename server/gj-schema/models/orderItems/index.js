export default function defineModel(sequelize, DataTypes) {
  const schema = {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    result: {
      type: DataTypes.STRING,
      allowNull: true
    },
    verdict: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    }
  };

  const options = {
    timestamps: true,
    updatedAt: false,
    paranoid: true
  };

  return sequelize.define("orderItems", schema, options);
}
