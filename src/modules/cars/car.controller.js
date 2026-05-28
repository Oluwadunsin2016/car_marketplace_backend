const { Car } = require('../../models');
const { deleteImagesByUrls, uploadImages } = require('../uploads/upload.service');
const { syncCurrentUser, toPublicUser } = require('../users/user.service');

const getAuthUser = async (req) => {
  const user = await syncCurrentUser(req.auth.userId);
  return toPublicUser(user);
};

const canManageListings = (user) => ['seller', 'dealer'].includes(user?.role);

const isOwner = (car, authUser) => {
  return String(car?.creator?.appUserId || '') === String(authUser.appUserId) || car?.creator?.email === authUser.email;
};

const getPaginationOptions = ({ page = 1, limit = 12 } = {}) => {
  const normalizedPage = Math.max(Number(page) || 1, 1);
  const normalizedLimit = Math.max(Number(limit) || 12, 1);

  return {
    limit: normalizedLimit,
    skip: (normalizedPage - 1) * normalizedLimit,
    page: normalizedPage,
  };
};

const buildPaginatedResponse = ({ count, rows, page, limit }) => ({
  cars: rows,
  pagination: {
    page,
    limit,
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    hasNextPage: page * limit < count,
    hasPreviousPage: page > 1,
  },
});

const getSortOption = (sort = 'newest') => {
  const sortOptions = {
    newest: { createdAt: -1 },
    'price-asc': { numericSellingPrice: 1, createdAt: -1 },
    'price-desc': { numericSellingPrice: -1, createdAt: -1 },
    'mileage-asc': { numericMileage: 1, createdAt: -1 },
    'year-desc': { numericYear: -1, createdAt: -1 },
  };

  return sortOptions[sort] || sortOptions.newest;
};

const buildNumericRangeFilter = (field, minValue, maxValue) => {
  const comparisons = [];
  const min = Number(minValue);
  const max = Number(maxValue);

  if (Number.isFinite(min)) comparisons.push({ $gte: [{ $toDouble: `$${field}` }, min] });
  if (Number.isFinite(max)) comparisons.push({ $lte: [{ $toDouble: `$${field}` }, max] });

  return comparisons;
};

const buildCarFilters = (query = {}) => {
  const {
    category,
    condition,
    fuelType,
    make,
    maxMileage,
    maxPrice,
    maxYear,
    minPrice,
    minYear,
    sellingPrice,
    transmission,
  } = query;
  const filters = {};
  const numericComparisons = [
    ...buildNumericRangeFilter('sellingPrice', minPrice, maxPrice || sellingPrice),
    ...buildNumericRangeFilter('year', minYear, maxYear),
    ...buildNumericRangeFilter('mileage', undefined, maxMileage),
  ];

  if (category) filters.category = category;
  if (condition) filters.condition = condition;
  if (fuelType) filters.fuelType = fuelType;
  if (make) filters.make = make;
  if (transmission) filters.transmission = transmission;
  if (numericComparisons.length > 0) filters.$expr = { $and: numericComparisons };

  return filters;
};

const buildPublicCarFilters = (query = {}) => {
  return buildCarFilters(query);
};

const findPaginatedCars = async (filters, query) => {
  const { page, limit, skip } = getPaginationOptions(query);
  const sort = getSortOption(query.sort);
  const pipelineBase = [
    {
      $addFields: {
        id: { $toString: '$_id' },
        numericSellingPrice: { $convert: { input: '$sellingPrice', to: 'double', onError: null, onNull: null } },
        numericMileage: { $convert: { input: '$mileage', to: 'double', onError: null, onNull: null } },
        numericYear: { $convert: { input: '$year', to: 'double', onError: null, onNull: null } },
      },
    },
    { $match: filters },
  ];
  const [countResult, rows] = await Promise.all([
    Car.aggregate([...pipelineBase, { $count: 'total' }]),
    Car.aggregate([...pipelineBase, { $sort: sort }, { $skip: skip }, { $limit: limit }]),
  ]);
  const count = countResult[0]?.total || 0;

  return buildPaginatedResponse({ count, rows, page, limit });
};

exports.createCar = async (req, res) => {
  let uploadedImages = [];

  try {
    const authUser = await getAuthUser(req);

    if (!canManageListings(authUser)) {
      return res.status(403).json({ message: 'Only sellers and dealers can create vehicle listings' });
    }

    const carData = {
      ...req.body,
      creator: authUser,
    };

    uploadedImages = await uploadImages(req.files || []);
    carData.carImages = uploadedImages.map((image) => image.url);

    if (carData.carImages.length === 0) {
      return res.status(400).json({
        message: 'Invalid car listing payload',
        errors: [{ field: 'images', message: 'At least one image is required' }],
      });
    }

    const car = await Car.create(carData);

    res.status(201).json({
      message: 'Car created successfully',
      car,
    });
  } catch (error) {
    await deleteImagesByUrls(uploadedImages.map((image) => image.url));

    console.error('Error creating car:', error);
    res.status(500).json({
      message: 'Failed to create car',
      error: error.message,
    });
  }
};

exports.updateCar = async (req, res) => {
  const { id } = req.body;
  let uploadedImages = [];

  try {
    if (!id) {
      return res.status(400).json({ message: 'Car id is required' });
    }

    const authUser = await getAuthUser(req);

    if (!canManageListings(authUser)) {
      return res.status(403).json({ message: 'Only sellers and dealers can update vehicle listings' });
    }

    const car = await Car.findById(id);

    if (!car) {
      return res.status(404).json({ message: 'Car listing not found' });
    }

    if (!isOwner(car, authUser)) {
      return res.status(403).json({ message: 'You do not have permission to update this listing' });
    }

    const previousImages = car.carImages || [];
    const retainedImages = Array.isArray(req.body.carImages) ? req.body.carImages : previousImages;
    uploadedImages = await uploadImages(req.files || []);
    const nextImages = [...new Set([...retainedImages, ...uploadedImages.map((image) => image.url)])];
    const removedImages = previousImages.filter((imageUrl) => !nextImages.includes(imageUrl));

    if (nextImages.length === 0) {
      await deleteImagesByUrls(uploadedImages.map((image) => image.url));
      return res.status(400).json({
        message: 'Invalid car listing payload',
        errors: [{ field: 'images', message: 'At least one image is required' }],
      });
    }

    car.set({
      ...req.body,
      carImages: nextImages,
    });
    await car.save();
    await deleteImagesByUrls(removedImages);

    res.status(200).json({ message: 'Car updated successfully', car });
  } catch (error) {
    await deleteImagesByUrls(uploadedImages.map((image) => image.url));

    console.error('Error updating car listing:', error);
    res.status(500).json({ message: 'Failed to update car listing', error: error.message });
  }
};

exports.getCarListingsByCreator = async (req, res) => {
  const { email } = req.params;

  try {
    const authUser = await getAuthUser(req);

    if (authUser.email !== email) {
      return res.status(403).json({
        message: 'You do not have permission to view listings for this user',
      });
    }

    const cars = await Car.find({ 'creator.email': email }).sort({ createdAt: -1 });

    res.status(200).json({
      message: cars.length ? 'Car listings fetched successfully' : 'No car listings found for the provided user',
      cars,
    });
  } catch (error) {
    console.error('Error fetching car listings:', error);
    res.status(500).json({
      message: 'Failed to fetch car listings.',
      error: error.message,
    });
  }
};

exports.getAllCarListing = async (req, res) => {
  try {
    const response = await findPaginatedCars(buildPublicCarFilters(req.query), req.query);

    res.status(200).json({
      message: response.cars.length ? 'Cars fetched successfully' : 'No car found',
      ...response,
    });
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({
      message: 'Failed to fetch cars.',
      error: error.message,
    });
  }
};

exports.getPopularCars = async (req, res) => {
  try {
    const response = await findPaginatedCars(buildPublicCarFilters(req.query), req.query);

    res.status(200).json({
      message: response.cars.length ? 'popular cars fetched successfully' : 'No cars found',
      ...response,
    });
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
    const car = await Car.findById(id);

    if (!car) {
      return res.status(404).json({
        message: 'The car is not found',
      });
    }

    res.status(200).json({
      message: 'Car is fetched successfully',
      car,
    });
  } catch (error) {
    console.error('Error fetching car:', error);
    res.status(500).json({
      message: 'Failed to fetch car.',
      error: error.message,
    });
  }
};

exports.deleteCar = async (req, res) => {
  const { id } = req.params;

  try {
    const authUser = await getAuthUser(req);

    if (!canManageListings(authUser)) {
      return res.status(403).json({ message: 'Only sellers and dealers can delete vehicle listings' });
    }

    const car = await Car.findById(id);

    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (!isOwner(car, authUser)) {
      return res.status(403).json({ message: 'You do not have permission to delete this listing' });
    }

    const imagesToDelete = car.carImages || [];

    await car.deleteOne();
    await deleteImagesByUrls(imagesToDelete);
    res.status(200).json({ message: 'Car deleted successfully' });
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({ message: 'Failed to delete car', error: error.message });
  }
};

exports.getCarsByCategory = async (req, res) => {
  const { category } = req.params;

  try {
    const response = await findPaginatedCars(buildPublicCarFilters({ ...req.query, category }), req.query);

    res.status(200).json({
      message: response.cars.length ? 'Cars fetched successfully' : 'No car found for the provided category',
      ...response,
    });
  } catch (error) {
    console.error('Error fetching car listings:', error);
    res.status(500).json({
      message: 'Failed to fetch car listings.',
      error: error.message,
    });
  }
};

exports.getCarsByOptions = async (req, res) => {
  try {
    const filters = buildPublicCarFilters(req.query);

    const response = await findPaginatedCars(filters, req.query);

    res.status(200).json({
      message: response.cars.length ? 'Cars fetched successfully.' : 'No cars found for the provided criteria.',
      ...response,
    });
  } catch (error) {
    console.error('Error fetching car listings:', error);
    res.status(500).json({
      message: 'Failed to fetch car listings.',
      error: error.message,
    });
  }
};
