export default function getClientSchema(DataTypes) {
  return {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isAlphanumeric: true,
        len: [3, 20]
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isNumeric: true,
        len: 11
      }
    },
    province: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isAlpha: true,
        len: [3, 20]
      }
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isAlpha: true,
        len: [3, 20]
      }
    },
    district: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isAlpha: true,
        len: [3, 20]
      }
    },
    street: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isAlphanumeric: true,
        len: [3, 50]
      }
    },
    zip: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isNumeric: true,
        len: 6
      }
    },
  };
}
