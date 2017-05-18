export default function getClientSchema(DataTypes) {
  return {
    level: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [1, 5]
      },
    },
    serial: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 32]
      }
    },
    requirement: {
      type: DataTypes.STRING,
      allowNull: false
    }
    standard: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 16]
      }
    }
  };
}
