const express = require('express');
const { createCar, getCarListingsByCreator, getAllCarListing, getPopularCars,getParticularCar,updateCar,deleteCar,getCarsByCategory,getCarsByOptions } = require('../controllers/carController');
const router = express.Router();

// Route to save car information
router.post('/create',createCar);
router.put('/update',updateCar);
router.get('/user-cars/:email',getCarListingsByCreator);
router.get('/all-cars',getAllCarListing);
router.get('/popular-cars',getPopularCars);
router.get('/particular-car/:id',getParticularCar);
router.delete('/delete/:id',deleteCar);
router.get('/cars/:category',getCarsByCategory);
router.get('/options',getCarsByOptions);

module.exports = router;
