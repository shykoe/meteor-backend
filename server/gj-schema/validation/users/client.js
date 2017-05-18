export default function getClientSchema(DataTypes) {
  return {
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isNumeric: true,
        len: 11
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isAlphanumeric: true,
        len: [3, 20]
      }
    }
  };
}
