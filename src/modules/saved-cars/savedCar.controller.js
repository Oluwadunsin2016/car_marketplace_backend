const mongoose = require('mongoose');
const { Car, SavedCar } = require('../../models');
const { getCurrentMarketplaceUser } = require('../users/user.service');

const getAuthUser = (req) => getCurrentMarketplaceUser(req.auth.userId);

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value));

exports.listSavedCars = async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const savedCars = await SavedCar.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate('car');

    const cars = savedCars.map((savedCar) => savedCar.car).filter(Boolean);

    res.status(200).json({
      message: cars.length ? 'Saved cars fetched successfully' : 'No saved cars found',
      cars,
      savedCarIds: cars.map((car) => String(car._id)),
    });
  } catch (error) {
    console.error('Error fetching saved cars:', error);
    res.status(500).json({ message: 'Failed to fetch saved cars', error: error.message });
  }
};

exports.saveCar = async (req, res) => {
  const { carId } = req.params;

  try {
    if (!isObjectId(carId)) {
      return res.status(400).json({ message: 'A valid car id is required' });
    }

    const user = await getAuthUser(req);
    const car = await Car.findById(carId);

    if (!car) {
      return res.status(404).json({ message: 'Car listing not found' });
    }

    await SavedCar.findOneAndUpdate(
      { user: user._id, car: car._id },
      { $setOnInsert: { user: user._id, car: car._id } },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Car saved successfully', carId: String(car._id) });
  } catch (error) {
    console.error('Error saving car:', error);
    res.status(500).json({ message: 'Failed to save car', error: error.message });
  }
};

exports.unsaveCar = async (req, res) => {
  const { carId } = req.params;

  try {
    if (!isObjectId(carId)) {
      return res.status(400).json({ message: 'A valid car id is required' });
    }

    const user = await getAuthUser(req);
    await SavedCar.deleteOne({ user: user._id, car: carId });

    res.status(200).json({ message: 'Car removed from saved cars', carId });
  } catch (error) {
    console.error('Error removing saved car:', error);
    res.status(500).json({ message: 'Failed to remove saved car', error: error.message });
  }
};
