const { Car } = require('../models'); // Import the Car model

// Function to save car information in the database
exports.createCar = async (req, res) => {
  try {
    const carData = req.body;
    // Save car information
    const car = await Car.create(carData);

    // Respond with the created car
    res.status(201).json({
      message: 'Car created successfully',
      car,
    });
  } catch (error) {
    console.error('Error creating car:', error);
    res.status(500).json({
      message: 'Failed to create car',
      error: error.message,
    });
  }
};

exports.updateCar = async (req, res) => {
  const updatedData = req.body;

  try {
    const car = await Car.findByPk(updatedData.id);

    if (!car) {
      return res.status(404).json({ message: 'Car listing not found' });
    }

    await car.update(updatedData); // Update the car record
    res.status(200).json({ message: 'Car updated successfully', car });
  } catch (error) {
    console.error('Error updating car listing:', error);
    res.status(500).json({ message: 'Failed to update car listing', error: error.message });
  }
};



exports.getCarListingsByCreator = async (req, res) => { 
  const { email } = req.params;
  try {
    if (!email) {
      return res.status(400).json({
        message: "The 'email' parameter is required in the URL",
      });
    }

    const carListings = await Car.findAll({
    order: [['createdAt', 'DESC']],
      where: {  'creator.email': email },
    });

    if (!carListings || carListings.length === 0) {
      res.status(200).json({
        message: "No car listings found for the provided user",
        cars: [],
      });
    }else{
    res.status(200).json({
      message: "Car listings fetched successfully",
      cars: carListings,
    });
    }

  } catch (error) {
    console.error("Error fetching car listings:", error);
    res.status(500).json({
      message: "Failed to fetch car listings.",
      error: error.message,
    });
  }
};

exports.getAllCarListing = async (req, res) => {
  try {

    const carListings = await Car.findAll({order: [['createdAt', 'DESC']]});

    if (!carListings || carListings.length === 0) {
      res.status(200).json({
        message: "No car found",
      cars: [],
      });
    }else{
    res.status(200).json({
      message: "Cars fetched successfully",
      cars: carListings,
    });
    }

  } catch (error) {
    console.error("Error fetching cars:", error);
    res.status(500).json({
      message: "Failed to fetch cars.",
      error: error.message,
    });
  }
};


exports.getPopularCars = async (req, res) => {
  try {
    // Fetch the popular 10 cars sorted by createdAt in descending order
    const popularCars = await Car.findAll({
      order: [['createdAt', 'DESC']], // Order by creation date in descending order
      limit: 10, // Limit to 10 results
    });

    if (!popularCars || popularCars.length === 0) {
      return res.status(200).json({
        message: 'No cars found',
      cars: [],
      });
    }else{
    res.status(200).json({
      message: 'popular cars fetched successfully',
      cars: popularCars,
    });
    }

  } catch (error) {
    console.error('Error fetching popular cars:', error);
    res.status(500).json({
      message: 'Failed to fetch popular cars',
      error: error.message,
    });
  }
};

exports.getParticularCar = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) {
      return res.status(400).json({
        message: "The 'id' parameter is required in the URL",
      });
    }

    const car = await Car.findOne({
      where: { id },
    });

    if (!car) {
      return res.status(404).json({
        message: "The car is not found",
      });
    }

    res.status(200).json({
      message: "Car is fetched successfully",
      car,
    });
  } catch (error) {
    console.error("Error fetching car:", error);
    res.status(500).json({
      message: "Failed to fetch car.",
      error: error.message,
    });
  }
};


exports.deleteCar = async (req, res) => {
  const { id } = req.params;

  try {
    const car = await Car.findByPk(id);

    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    await car.destroy(); // Deletes the car record
    res.status(200).json({ message: 'Car deleted successfully' });
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({ message: 'Failed to delete car', error: error.message });
  }
};


exports.getCarsByCategory = async (req, res) => {
  const { category } = req.params;
  try {
    if (!category) {
      return res.status(400).json({
        message: "The 'category' parameter is required in the URL",
      });
    }

    const carListings = await Car.findAll({
    order: [['createdAt', 'DESC']],
      where: { category },
    });

    if (!carListings || carListings.length === 0) {
      res.status(200).json({
        message: "No car found for the provided category",
        cars: [],
      });
    }else{
    res.status(200).json({
      message: "Cars fetched successfully",
      cars: carListings,
    });
    }

  } catch (error) {
    console.error("Error fetching car listings:", error);
    res.status(500).json({
      message: "Failed to fetch car listings.",
      error: error.message,
    });
  }
};

exports.getCarsByOptions = async (req, res) => {
  const { condition, make, sellingPrice } = req.query;

  try {
    // Validate if at least one search parameter is provided
    if (!condition && !make && !sellingPrice) {
      return res.status(400).json({
        message: "At least one search parameter (condition, make, or sellingPrice) must be provided.",
      });
    }

    // Build a dynamic filter based on the provided parameters
    const filters = {};
    if (condition) filters.condition = condition;
    if (make) filters.make = make;
    if (sellingPrice) filters.sellingPrice = sellingPrice;

    // Fetch cars based on the filters
    const carListings = await Car.findAll({
      order: [['createdAt', 'DESC']],
      where: filters,
    });

    // Handle cases where no cars are found
    if (!carListings || carListings.length === 0) {
      return res.status(200).json({
        message: "No cars found for the provided criteria.",
        cars: [],
      });
    }

    // Respond with the fetched cars
    res.status(200).json({
      message: "Cars fetched successfully.",
      cars: carListings,
    });
  } catch (error) {
    console.error("Error fetching car listings:", error);
    res.status(500).json({
      message: "Failed to fetch car listings.",
      error: error.message,
    });
  }
};






