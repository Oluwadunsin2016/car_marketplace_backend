const { z } = require('zod');

const nonEmptyString = (field) => z.string().trim().min(1, `${field} is required`);

const userIdParamSchema = z.object({
  userId: nonEmptyString('userId'),
});

const messageSellerSchema = z.object({
  creator: z.object({
    id: z.union([nonEmptyString('creator.id'), z.number()]),
    appUserId: z.union([nonEmptyString('creator.appUserId'), z.number()]).optional().nullable(),
    name: z.string().trim().optional().nullable(),
    email: z.string().email().optional().nullable(),
    image: z.string().url().optional().nullable(),
    imageUrl: z.string().url().optional().nullable(),
  }),
});

const updateCurrentUserSchema = z.object({
  name: nonEmptyString('name'),
  phone: nonEmptyString('phone').max(30, 'phone must be 30 characters or fewer'),
  location: nonEmptyString('location').max(120, 'location must be 120 characters or fewer'),
  dealerName: z.string().trim().max(120, 'dealerName must be 120 characters or fewer').optional().nullable(),
  role: z.enum(['buyer', 'seller', 'dealer']),
});

module.exports = {
  messageSellerSchema,
  updateCurrentUserSchema,
  userIdParamSchema,
};
