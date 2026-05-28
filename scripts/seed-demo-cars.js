require('dotenv').config();

const mongoose = require('mongoose');
const connectDatabase = require('../src/config/database');
const { Car, User, Conversation, Message, SavedCar } = require('../src/models');

const creators = [
  {
    id: 'demo_seller_ada',
    name: 'Ada Motors',
    email: 'ada.motors@example.com',
    imageUrl: null,
  },
  {
    id: 'demo_seller_bayo',
    name: 'Bayo Autos',
    email: 'bayo.autos@example.com',
    imageUrl: null,
  },
  {
    id: 'demo_seller_chika',
    name: 'Chika Premium Cars',
    email: 'chika.cars@example.com',
    imageUrl: null,
  },
  {
    id: 'demo_seller_daniel',
    name: 'Daniel Auto Hub',
    email: 'daniel.autohub@example.com',
    imageUrl: null,
  },
];

const images = [
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80',
];

const featureSets = [
  {
    airConditioner: true,
    digitalOdometer: true,
    heater: true,
    leatherSeats: true,
    navigation: true,
    rearCamera: true,
    bluetooth: true,
  },
  {
    airConditioner: true,
    antiLockBraking: true,
    brakeAssist: true,
    powerSteering: true,
    powerWindows: true,
    airbags: true,
  },
  {
    touchScreen: true,
    appleCarPlay: true,
    androidAuto: true,
    keylessEntry: true,
    laneAssist: true,
    blindSpotMonitor: true,
  },
  {
    sunRoof: true,
    alloyWheels: true,
    cruiseControl: true,
    parkingSensors: true,
    usbPort: true,
    heatedSeats: true,
  },
];

const cars = [
  ['Toyota', 'Camry XSE', 'Sedan', 'Used', '2021', 'Automatic', 'Petrol', '28500', '32000000', '36500000', 'AWD', '2.5L', '4', 'Pearl White', '4'],
  ['Honda', 'Accord Touring', 'Sedan', 'Certified Pre-Owned', '2020', 'Automatic', 'Petrol', '34000', '29500000', '33000000', 'FWD', '2.0L Turbo', '4', 'Crystal Black', '4'],
  ['Mercedes-Benz', 'GLE 450', 'SUV', 'Used', '2022', 'Automatic', 'Petrol', '18000', '87000000', '94500000', 'AWD', '3.0L', '6', 'Obsidian Black', '4'],
  ['BMW', 'X5 xDrive40i', 'SUV', 'Used', '2021', 'Automatic', 'Petrol', '25500', '76000000', '82000000', 'AWD', '3.0L', '6', 'Alpine White', '4'],
  ['Lexus', 'RX 350', 'SUV', 'Certified Pre-Owned', '2020', 'Automatic', 'Petrol', '41000', '51000000', '57500000', 'AWD', '3.5L', '6', 'Atomic Silver', '4'],
  ['Tesla', 'Model 3 Long Range', 'Electric', 'Used', '2022', 'Automatic', 'Electric', '22000', '54000000', '61000000', 'AWD', 'Electric', '0', 'Deep Blue', '4'],
  ['Ford', 'Mustang GT', 'Coupe', 'Used', '2019', 'Manual', 'Petrol', '36000', '48000000', '53500000', 'RWD', '5.0L', '8', 'Race Red', '2'],
  ['Toyota', 'Land Cruiser Prado', 'SUV', 'Used', '2021', 'Automatic', 'Petrol', '30000', '70000000', '79500000', '4WD', '4.0L', '6', 'Black', '4'],
  ['Hyundai', 'Tucson Limited', 'SUV', 'Used', '2022', 'Automatic', 'Petrol', '19500', '35000000', '39500000', 'AWD', '2.5L', '4', 'Amazon Gray', '4'],
  ['Kia', 'Sportage SX', 'SUV', 'New', '2024', 'Automatic', 'Hybrid', '1200', '46000000', '49500000', 'AWD', '1.6L Turbo', '4', 'Wolf Gray', '4'],
  ['Nissan', 'Altima SR', 'Sedan', 'Used', '2020', 'CVT', 'Petrol', '44000', '22000000', '25500000', 'FWD', '2.5L', '4', 'Gun Metallic', '4'],
  ['Audi', 'Q7 Premium Plus', 'SUV', 'Used', '2021', 'Automatic', 'Petrol', '27000', '69000000', '75000000', 'AWD', '3.0L', '6', 'Navarra Blue', '4'],
  ['Porsche', 'Cayenne', 'SUV', 'Used', '2020', 'Automatic', 'Petrol', '31000', '89000000', '98000000', 'AWD', '3.0L', '6', 'Carrara White', '4'],
  ['Mazda', 'CX-5 Grand Touring', 'SUV', 'Used', '2021', 'Automatic', 'Petrol', '29000', '29500000', '33000000', 'AWD', '2.5L', '4', 'Soul Red', '4'],
  ['Jeep', 'Wrangler Unlimited Sahara', 'SUV', 'Used', '2022', 'Automatic', 'Petrol', '16000', '57000000', '63000000', '4WD', '2.0L Turbo', '4', 'Sarge Green', '4'],
  ['Range Rover', 'Velar P250', 'SUV', 'Used', '2021', 'Automatic', 'Petrol', '26000', '86000000', '94000000', 'AWD', '2.0L', '4', 'Fuji White', '4'],
  ['Chevrolet', 'Tahoe LT', 'SUV', 'Used', '2021', 'Automatic', 'Petrol', '38000', '68000000', '73500000', '4WD', '5.3L', '8', 'Summit White', '4'],
  ['Honda', 'CR-V EX-L', 'SUV', 'Used', '2022', 'CVT', 'Petrol', '21000', '33000000', '37000000', 'AWD', '1.5L Turbo', '4', 'Modern Steel', '4'],
  ['Toyota', 'Corolla SE', 'Sedan', 'Used', '2021', 'CVT', 'Petrol', '39000', '18500000', '21500000', 'FWD', '2.0L', '4', 'Classic Silver', '4'],
  ['Mercedes-Benz', 'C300 AMG Line', 'Sedan', 'Used', '2020', 'Automatic', 'Petrol', '35000', '46000000', '52000000', 'RWD', '2.0L Turbo', '4', 'Polar White', '4'],
  ['BMW', '330i M Sport', 'Sedan', 'Used', '2021', 'Automatic', 'Petrol', '24000', '43000000', '49000000', 'RWD', '2.0L Turbo', '4', 'Portimao Blue', '4'],
  ['Volkswagen', 'Atlas SEL', 'SUV', 'Used', '2021', 'Automatic', 'Petrol', '33000', '39000000', '44000000', 'AWD', '3.6L', '6', 'Pure Gray', '4'],
  ['Subaru', 'Outback Touring', 'SUV', 'Used', '2022', 'CVT', 'Petrol', '23000', '34000000', '38500000', 'AWD', '2.5L', '4', 'Autumn Green', '4'],
  ['Cadillac', 'Escalade Premium Luxury', 'SUV', 'Used', '2021', 'Automatic', 'Petrol', '28000', '98000000', '108000000', '4WD', '6.2L', '8', 'Black Raven', '4'],
  ['Lexus', 'ES 350 F Sport', 'Sedan', 'Used', '2022', 'Automatic', 'Petrol', '17000', '44000000', '49800000', 'FWD', '3.5L', '6', 'Ultra White', '4'],
  ['Toyota', 'RAV4 Hybrid Limited', 'Hybrid', 'Used', '2022', 'Automatic', 'Hybrid', '20000', '42000000', '46500000', 'AWD', '2.5L Hybrid', '4', 'Blueprint', '4'],
  ['Mercedes-Benz', 'Sprinter Executive', 'Van', 'Used', '2020', 'Automatic', 'Diesel', '45000', '72000000', '79500000', 'RWD', '3.0L Diesel', '6', 'Jet Black', '4'],
  ['Dodge', 'Charger R/T', 'Sedan', 'Used', '2020', 'Automatic', 'Petrol', '36000', '37000000', '42000000', 'RWD', '5.7L', '8', 'Pitch Black', '4'],
  ['GMC', 'Sierra 1500 Denali', 'Truck', 'Used', '2021', 'Automatic', 'Petrol', '32000', '62000000', '69000000', '4WD', '5.3L', '8', 'Onyx Black', '4'],
  ['Volvo', 'XC90 Inscription', 'SUV', 'Used', '2021', 'Automatic', 'Hybrid', '26000', '58000000', '64500000', 'AWD', '2.0L Hybrid', '4', 'Denim Blue', '4'],
  ['Acura', 'MDX Advance', 'SUV', 'Used', '2022', 'Automatic', 'Petrol', '19000', '52000000', '58500000', 'AWD', '3.5L', '6', 'Platinum White', '4'],
  ['Infiniti', 'QX60 Sensory', 'SUV', 'Certified Pre-Owned', '2021', 'Automatic', 'Petrol', '28000', '43000000', '49000000', 'AWD', '3.5L', '6', 'Graphite Shadow', '4'],
  ['Genesis', 'GV80 Prestige', 'SUV', 'Used', '2022', 'Automatic', 'Petrol', '21000', '69000000', '76000000', 'AWD', '3.5L Turbo', '6', 'Savile Silver', '4'],
  ['Mini', 'Cooper S Countryman', 'Crossover', 'Used', '2021', 'Automatic', 'Petrol', '25000', '31000000', '35500000', 'AWD', '2.0L Turbo', '4', 'British Racing Green', '4'],
  ['Peugeot', '3008 GT Line', 'SUV', 'Used', '2022', 'Automatic', 'Petrol', '17000', '28500000', '32500000', 'FWD', '1.6L Turbo', '4', 'Pearl White', '4'],
  ['Land Rover', 'Discovery Sport', 'SUV', 'Used', '2020', 'Automatic', 'Diesel', '39000', '47000000', '53500000', 'AWD', '2.0L Diesel', '4', 'Eiger Grey', '4'],
  ['Jaguar', 'F-Pace R-Dynamic', 'SUV', 'Used', '2021', 'Automatic', 'Petrol', '26000', '61000000', '69000000', 'AWD', '2.0L Turbo', '4', 'Santorini Black', '4'],
  ['Toyota', 'Hilux Invincible', 'Truck', 'Used', '2022', 'Automatic', 'Diesel', '24000', '45500000', '51000000', '4WD', '2.8L Diesel', '4', 'Oxide Bronze', '4'],
  ['Mitsubishi', 'Pajero Sport', 'SUV', 'Used', '2021', 'Automatic', 'Diesel', '33000', '36500000', '42000000', '4WD', '2.4L Diesel', '4', 'Sterling Silver', '4'],
  ['Suzuki', 'Jimny GLX', 'SUV', 'Used', '2023', 'Automatic', 'Petrol', '9000', '26000000', '30500000', '4WD', '1.5L', '4', 'Kinetic Yellow', '2'],
];

const buildListing = (car, index) => {
  const [
    make,
    model,
    category,
    condition,
    year,
    transmission,
    fuelType,
    mileage,
    sellingPrice,
    originalPrice,
    driveType,
    engineSize,
    cylinder,
    color,
    door,
  ] = car;

  return {
    creator: creators[index % creators.length],
    carImages: [
      images[index % images.length],
      images[(index + 1) % images.length],
    ],
    listingTitle: `${year} ${make} ${model}`,
    tagLine: `${condition} ${category} with clean history and excellent condition`,
    originalPrice,
    sellingPrice,
    category,
    condition,
    make,
    model,
    year,
    driveType,
    transmission,
    fuelType,
    mileage,
    engineSize,
    cylinder,
    color,
    door,
    offerType: index % 3 === 0 ? 'Negotiable' : 'Fixed',
    vin: `DEMO${String(index + 1).padStart(8, '0')}`,
    listingDescription: `This ${year} ${make} ${model} is prepared as a demo marketplace listing with complete vehicle details, strong photos, and seller information. It is ideal for testing search, category pages, listing details, profile ownership, and the upcoming professional redesign.`,
    features: featureSets[index % featureSets.length],
  };
};

const seed = async () => {
  try {
    await connectDatabase();

    await Promise.all([
      Car.deleteMany({}),
      Conversation.deleteMany({}),
      Message.deleteMany({}),
      SavedCar.deleteMany({}),
      User.deleteMany({}),
    ]);

    const demoUsers = await User.insertMany(
      creators.map((creator) => ({
        clerkId: creator.id,
        email: creator.email,
        name: creator.name,
        imageUrl: creator.imageUrl,
        authProvider: 'demo',
        role: 'seller',
        phone: '+234 800 000 0000',
        location: 'Lagos, Nigeria',
        dealerName: creator.name,
        lastSyncedAt: new Date(),
      }))
    );
    const usersByClerkId = new Map(demoUsers.map((user) => [user.clerkId, user]));

    const listings = cars.map((car, index) => {
      const listing = buildListing(car, index);
      const creator = usersByClerkId.get(listing.creator.id);

      return {
        ...listing,
        creator: {
          id: creator.clerkId,
          appUserId: creator._id,
          name: creator.name,
          email: creator.email,
          image: creator.imageUrl,
          imageUrl: creator.imageUrl,
          role: creator.role,
          phone: creator.phone,
          location: creator.location,
          dealerName: creator.dealerName,
        },
      };
    });
    await Car.insertMany(listings);

    console.log(`Database cleared and seeded with ${listings.length} demo cars across ${creators.length} sellers.`);
  } catch (error) {
    console.error('Failed to seed demo cars:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seed();
