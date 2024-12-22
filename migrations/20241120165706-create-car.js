'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Cars', {
     id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      creator: {
             type: Sequelize.JSON,
      allowNull: true, 
      },
      carImages: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
      },
      listingTitle: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      tagLine: {
        type: Sequelize.STRING,
      },
      originalPrice: {
        type: Sequelize.STRING,
      },
      sellingPrice: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      condition: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      make: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      model: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      year: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      driveType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      transmission: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      fuelType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      mileage: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      engineSize: {
        type: Sequelize.STRING,
      },
      cylinder: {
        type: Sequelize.STRING,
      },
      color: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      door: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      offerType: {
        type: Sequelize.STRING,
      },
      vin: {
        type: Sequelize.STRING,
      },
      listingDescription: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    features: {
      type: Sequelize.JSON,
      allowNull: true, 
    },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Cars');
  }
};