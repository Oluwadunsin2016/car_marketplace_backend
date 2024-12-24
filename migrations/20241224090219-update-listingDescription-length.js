'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Cars', 'listingDescription', {
      type: Sequelize.TEXT, // Change to TEXT to allow unlimited or larger content
      allowNull: false,
    });
  },

  async down (queryInterface, Sequelize) {
   await queryInterface.changeColumn('Cars', 'listingDescription', {
      type: Sequelize.STRING, // Revert back to STRING with default size
      allowNull: false,
    });
  }
};
