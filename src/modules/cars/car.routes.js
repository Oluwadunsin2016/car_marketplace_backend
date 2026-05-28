const express = require('express');
const { createCar, getCarListingsByCreator, getAllCarListing, getPopularCars,getParticularCar,updateCar,deleteCar,getCarsByCategory,getCarsByOptions } = require('./car.controller');
const { requireAuth } = require('../../middleware/auth');
const { imageUpload } = require('../../middleware/upload');
const { validateRequest } = require('../../middleware/validateRequest');
const {
  carCreateSchema,
  carOptionsQuerySchema,
  carUpdateSchema,
  categoryParamSchema,
  emailParamSchema,
  idParamSchema,
  paginationQuerySchema,
  popularCarsQuerySchema,
} = require('./car.validation');
const router = express.Router();

// Route to save car information
router.post('/create',requireAuth,imageUpload.array('images', 10),validateRequest({ body: carCreateSchema }),createCar);
router.put('/update',requireAuth,imageUpload.array('images', 10),validateRequest({ body: carUpdateSchema }),updateCar);
router.get('/user-cars/:email',requireAuth,validateRequest({ params: emailParamSchema }),getCarListingsByCreator);
router.get('/all-cars',validateRequest({ query: paginationQuerySchema }),getAllCarListing);
router.get('/popular-cars',validateRequest({ query: popularCarsQuerySchema }),getPopularCars);
router.get('/particular-car/:id',validateRequest({ params: idParamSchema }),getParticularCar);
router.delete('/delete/:id',requireAuth,validateRequest({ params: idParamSchema }),deleteCar);
router.get('/cars/:category',validateRequest({ params: categoryParamSchema, query: carOptionsQuerySchema }),getCarsByCategory);
router.get('/options',validateRequest({ query: carOptionsQuerySchema }),getCarsByOptions);

module.exports = router;
