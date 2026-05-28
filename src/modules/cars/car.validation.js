const { z } = require('zod');

const nonEmptyString = (field) => z.string().trim().min(1, `${field} is required`);
const optionalString = z.string().trim().optional();

const jsonObject = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') return {};
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch (_error) {
    return value;
  }
}, z.record(z.string(), z.boolean()));

const jsonStringArray = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch (_error) {
    return value;
  }
}, z.array(z.string().url()).optional());

const carCreateSchema = z.object({
  listingTitle: nonEmptyString('listingTitle'),
  tagLine: optionalString,
  originalPrice: optionalString,
  sellingPrice: nonEmptyString('sellingPrice'),
  category: nonEmptyString('category'),
  condition: nonEmptyString('condition'),
  make: nonEmptyString('make'),
  model: nonEmptyString('model'),
  year: nonEmptyString('year'),
  driveType: nonEmptyString('driveType'),
  transmission: nonEmptyString('transmission'),
  fuelType: nonEmptyString('fuelType'),
  mileage: nonEmptyString('mileage'),
  engineSize: optionalString,
  cylinder: optionalString,
  color: nonEmptyString('color'),
  door: nonEmptyString('door'),
  offerType: optionalString,
  vin: optionalString,
  listingDescription: nonEmptyString('listingDescription'),
  features: jsonObject.default({}),
  status: z.enum(['active', 'sold']).optional(),
}).strip();

const carUpdateSchema = carCreateSchema.partial().extend({
  id: nonEmptyString('id'),
  carImages: jsonStringArray,
});

const idParamSchema = z.object({
  id: nonEmptyString('id'),
});

const emailParamSchema = z.object({
  email: z.string().email('A valid email is required'),
});

const categoryParamSchema = z.object({
  category: nonEmptyString('category'),
});

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
});

const popularCarsQuerySchema = paginationQuerySchema.extend({
  limit: z.coerce.number().int().positive().max(20).default(10),
});

const carOptionsQuerySchema = z
  .object({
    condition: optionalString,
    make: optionalString,
    category: optionalString,
    fuelType: optionalString,
    transmission: optionalString,
    sellingPrice: optionalString,
    minPrice: optionalString,
    maxPrice: optionalString,
    minYear: optionalString,
    maxYear: optionalString,
    maxMileage: optionalString,
    sort: z.enum(['newest', 'price-asc', 'price-desc', 'mileage-asc', 'year-desc']).optional(),
  })
  .merge(paginationQuerySchema);

module.exports = {
  carCreateSchema,
  carOptionsQuerySchema,
  carUpdateSchema,
  categoryParamSchema,
  emailParamSchema,
  idParamSchema,
  paginationQuerySchema,
  popularCarsQuerySchema,
};
