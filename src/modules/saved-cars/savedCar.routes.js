const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const savedCarController = require('./savedCar.controller');

const router = express.Router();

router.use(requireAuth);

router.get('/', savedCarController.listSavedCars);
router.post('/:carId', savedCarController.saveCar);
router.delete('/:carId', savedCarController.unsaveCar);

module.exports = router;
