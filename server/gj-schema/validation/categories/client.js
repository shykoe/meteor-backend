export default function getClientSchema(DataTypes) {
  return {
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
