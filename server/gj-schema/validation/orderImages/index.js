import Consts from 'gj-schema/consts';

export default function defineModel(sequelize, DataTypes) {
  const schema = {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    img: {
      type: DataTypes.BLOB,
      allowNull: false
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
  };

  const options = {
    timestamps: true,
    updatedAt: false
  };

  return sequelize.define("orderImages", schema, options);
}
