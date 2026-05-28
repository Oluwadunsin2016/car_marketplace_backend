const { clerkClient } = require('@clerk/clerk-sdk-node');
const { Car, User } = require('../../models');
const { deleteFileByPublicId, deleteImageByUrl, uploadImage } = require('../uploads/upload.service');

const getPrimaryEmail = (clerkUser) => {
  return clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress;
};

const getAuthProvider = (clerkUser) => {
  const externalAccount = clerkUser.externalAccounts?.[0];

  if (!externalAccount) return 'email';

  return externalAccount.provider?.replace(/^oauth_/, '') || 'oauth';
};

const buildMarketplaceUserPayload = (clerkUser) => {
  const email = getPrimaryEmail(clerkUser);
  const externalAccount = clerkUser.externalAccounts?.[0];
  const externalName =
    externalAccount?.name ||
    [externalAccount?.firstName, externalAccount?.lastName].filter(Boolean).join(' ');
  const name =
    clerkUser.fullName ||
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
    externalName ||
    email?.split('@')[0] ||
    'Marketplace user';

  return {
    clerkId: clerkUser.id,
    email,
    name,
    imageUrl: clerkUser.imageUrl || null,
    authProvider: getAuthProvider(clerkUser),
    lastSyncedAt: new Date(),
  };
};

const findLocalUserByClerkId = (clerkUserId) => {
  return User.findOne({ clerkId: clerkUserId });
};

const normalizeClerkError = (error) => {
  const nextError = new Error('Authentication provider is temporarily unavailable. Please try again shortly.');
  nextError.status = error.status >= 500 ? 503 : error.status || 500;
  nextError.cause = error;
  return nextError;
};

const syncCurrentUser = async (clerkUserId) => {
  let clerkUser;

  try {
    clerkUser = await clerkClient.users.getUser(clerkUserId);
  } catch (error) {
    const localUser = await findLocalUserByClerkId(clerkUserId);

    if (localUser) {
      console.warn('Using cached marketplace user because Clerk sync failed', {
        clerkUserId,
        status: error.status,
        code: error.code,
        clerkTraceId: error.clerkTraceId,
      });
      return localUser;
    }

    throw normalizeClerkError(error);
  }

  const payload = buildMarketplaceUserPayload(clerkUser);

  if (!payload.email) {
    const error = new Error('Authenticated user does not have an email address');
    error.status = 400;
    throw error;
  }

  const existingUser =
    (await User.findOne({ clerkId: payload.clerkId })) ||
    (await User.findOne({ email: payload.email }));

  if (existingUser) {
    if (existingUser.profileImagePublicId) {
      payload.imageUrl = existingUser.imageUrl;
    }

    existingUser.set(payload);
    await existingUser.save();
    return existingUser;
  }

  return User.create(payload);
};

const getCurrentMarketplaceUser = async (clerkUserId) => {
  const localUser = await findLocalUserByClerkId(clerkUserId);
  if (localUser) return localUser;

  return syncCurrentUser(clerkUserId);
};

const getMissingProfileFields = (user) => {
  const missingFields = [];

  if (!user.name?.trim()) missingFields.push('name');
  if (!user.email?.trim()) missingFields.push('email');
  if (!user.phone?.trim()) missingFields.push('phone');
  if (!user.location?.trim()) missingFields.push('location');
  if (!['buyer', 'seller', 'dealer'].includes(user.role)) missingFields.push('role');

  return missingFields;
};

const isProfileComplete = (user) => {
  const hasValidRole = ['buyer', 'seller', 'dealer'].includes(user.role);

  return Boolean(
    user.name?.trim() &&
      user.email?.trim() &&
      user.phone?.trim() &&
      user.location?.trim() &&
      hasValidRole
  );
};

const toPublicUser = (user) => ({
  id: user.clerkId,
  appUserId: String(user._id || user.id),
  name: user.name,
  email: user.email,
  image: user.imageUrl,
  imageUrl: user.imageUrl,
  authProvider: user.authProvider,
  role: user.role,
  phone: user.phone,
  location: user.location,
  dealerName: user.dealerName,
  profileComplete: isProfileComplete(user),
  missingProfileFields: getMissingProfileFields(user),
});

const updateCurrentUser = async (clerkUserId, payload, imageFile) => {
  const user = await syncCurrentUser(clerkUserId);
  const previousImageUrl = user.imageUrl;
  const previousProfileImagePublicId = user.profileImagePublicId;
  let uploadedImage = null;

  if (imageFile) {
    uploadedImage = await uploadImage(imageFile);
  }

  user.set({
    name: payload.name || user.name,
    imageUrl: uploadedImage?.url || user.imageUrl,
    profileImagePublicId: uploadedImage?.publicId || user.profileImagePublicId,
    phone: payload.phone,
    location: payload.location,
    dealerName: payload.dealerName || null,
    role: payload.role,
    lastSyncedAt: new Date(),
  });

  try {
    await user.save();

    if (uploadedImage && previousProfileImagePublicId) {
      await deleteFileByPublicId(previousProfileImagePublicId, 'image');
    } else if (uploadedImage && previousImageUrl) {
      await deleteImageByUrl(previousImageUrl);
    }

    await Car.updateMany(
      {
        $or: [
          { 'creator.appUserId': user._id },
          { 'creator.id': user.clerkId },
          { 'creator.email': user.email },
        ],
      },
      {
        $set: {
          'creator.name': user.name,
          'creator.image': user.imageUrl,
          'creator.imageUrl': user.imageUrl,
          'creator.role': user.role,
          'creator.phone': user.phone,
          'creator.location': user.location,
          'creator.dealerName': user.dealerName,
        },
      }
    );
  } catch (error) {
    if (uploadedImage?.publicId) {
      await deleteFileByPublicId(uploadedImage.publicId, 'image');
    }
    throw error;
  }

  return user;
};

module.exports = {
  findLocalUserByClerkId,
  getMissingProfileFields,
  getCurrentMarketplaceUser,
  syncCurrentUser,
  toPublicUser,
  updateCurrentUser,
};
