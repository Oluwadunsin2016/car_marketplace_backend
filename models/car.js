'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Car extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Car.init({
     creator: {
      type: DataTypes.JSON,
      allowNull: false, 
      defaultValue: {},
    },
     carImages: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
     listingTitle: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tagLine: {
      type: DataTypes.STRING,
    },
    originalPrice: {
      type: DataTypes.STRING,
    },
    sellingPrice: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    condition: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    make: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    year: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    driveType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    transmission: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fuelType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mileage: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    engineSize: {
      type: DataTypes.STRING,
    },
    cylinder: {
      type: DataTypes.STRING,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    door: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    offerType: {
      type: DataTypes.STRING,
    },
    vin: {
      type: DataTypes.STRING,
    },
    listingDescription: {
      type: DataTypes.STRING,
      allowNull: false,
    },
 features: {
      type: DataTypes.JSON,
      allowNull: true, 
      defaultValue: {},
    },
  }, {
    sequelize,
    modelName: 'Car',
  });
  return Car;
};