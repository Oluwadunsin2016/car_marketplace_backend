require('dotenv').config();
const mongoose = require('mongoose');
const { getCurrentMarketplaceUser, syncCurrentUser, toPublicUser, updateCurrentUser } = require('./user.service');
const { Car, User } = require('../../models');
const chatService = require('../chat/chat.service');

const getAuthUser = async (req) => {
  const user = await getCurrentMarketplaceUser(req.auth.userId);
  return user;
};

const resolveSellerId = async (creator = {}) => {
  if (creator.appUserId) return creator.appUserId;
  if (creator.id && /^[a-f\d]{24}$/i.test(String(creator.id))) return creator.id;

  const filters = [];
  if (creator.id) filters.push({ clerkId: creator.id });
  if (creator.email) filters.push({ email: creator.email });

  if (filters.length === 0) return null;

  const seller = await User.findOne({ $or: filters });
  return seller?._id?.toString() || null;
};

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value));

const getProfileLookupFilters = (value) => {
  const id = decodeURIComponent(String(value || '')).trim();
  const filters = [];

  if (!id || id === 'undefined' || id === 'null' || id === '[object Object]') {
    return { id, filters };
  }

  if (isObjectId(id)) filters.push({ _id: id });
  filters.push({ clerkId: id });
  if (id.includes('@')) filters.push({ email: id.toLowerCase() });

  return { id, filters };
};

const findListingsForIdentity = (identity = {}) => {
  const filters = [];

  if (identity._id && isObjectId(identity._id)) filters.push({ 'creator.appUserId': identity._id });
  if (identity.appUserId && isObjectId(identity.appUserId)) filters.push({ 'creator.appUserId': identity.appUserId });
  if (identity.clerkId) filters.push({ 'creator.id': identity.clerkId });
  if (identity.id) filters.push({ 'creator.id': identity.id });
  if (identity.email) filters.push({ 'creator.email': String(identity.email).toLowerCase() });

  const query = filters.length ? { $or: filters } : { _id: null };

  return Car.find(query).sort({ createdAt: -1 });
};

const buildProfileFromUser = (user, listings) => ({
  id: user.clerkId,
  appUserId: user._id.toString(),
  name: user.name,
  email: user.email,
  image: user.imageUrl,
  imageUrl: user.imageUrl,
  role: user.role,
  phone: user.phone,
  location: user.location,
  dealerName: user.dealerName,
  createdAt: user.createdAt,
  listingCount: listings.length,
});

const buildProfileFromCreator = (creator = {}, listings) => ({
  id: creator.id,
  appUserId: creator.appUserId ? String(creator.appUserId) : creator.id,
  name: creator.name || 'Marketplace seller',
  email: creator.email || '',
  image: creator.image || creator.imageUrl || null,
  imageUrl: creator.imageUrl || creator.image || null,
  role: creator.role || 'seller',
  phone: creator.phone || '',
  location: creator.location || '',
  dealerName: creator.dealerName || null,
  listingCount: listings.length,
});

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await syncCurrentUser(req.auth.userId);

    res.status(200).json({
      message: 'User synced successfully',
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(error.status || 500).json({ message: error.message || 'Failed to sync user' });
  }
};

exports.updateCurrentUser = async (req, res) => {
  try {
    const user = await updateCurrentUser(req.auth.userId, req.body, req.file);

    res.status(200).json({
      message: 'Marketplace profile updated successfully',
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error('Error updating marketplace user:', error);
    res.status(error.status || 500).json({ message: error.message || 'Failed to update user' });
  }
};

exports.getPublicUserProfile = async (req, res) => {
  const { id, filters } = getProfileLookupFilters(req.params.id);

  try {
    if (!filters.length) {
      return res.status(400).json({ message: 'A valid marketplace profile id is required' });
    }

    let user = await User.findOne({ $or: filters });

    if (user) {
      const listings = await findListingsForIdentity(user);

      return res.status(200).json({
        message: 'Marketplace profile fetched successfully',
        profile: buildProfileFromUser(user, listings),
        cars: listings,
      });
    }

    const creatorFilters = [];
    if (isObjectId(id)) creatorFilters.push({ 'creator.appUserId': id });
    creatorFilters.push({ 'creator.id': id });
    if (id.includes('@')) creatorFilters.push({ 'creator.email': id.toLowerCase() });

    const car = await Car.findOne({ $or: creatorFilters });

    if (!car?.creator) {
      return res.status(404).json({ message: 'Marketplace profile was not found' });
    }

    const creator = car.creator;
    const userFilters = [];
    if (creator.appUserId && isObjectId(creator.appUserId)) userFilters.push({ _id: creator.appUserId });
    if (creator.id) userFilters.push({ clerkId: creator.id });
    if (creator.email) userFilters.push({ email: creator.email });

    user = userFilters.length ? await User.findOne({ $or: userFilters }) : null;
    const listings = await findListingsForIdentity(user || creator);

    res.status(200).json({
      message: 'Marketplace profile fetched successfully',
      profile: user ? buildProfileFromUser(user, listings) : buildProfileFromCreator(creator, listings),
      cars: listings,
    });
  } catch (error) {
    console.error('Error fetching public marketplace profile:', error);
    res.status(500).json({ message: 'Failed to fetch marketplace profile', error: error.message });
  }
};

exports.getAvailableUsers=async(req, res)=> {
  try {
    const currentUserId = req.auth.userId;
    await getCurrentMarketplaceUser(currentUserId);
    const users = await User.find({}).sort({ createdAt: -1 });
    const availableUsers = users
      .filter((user) => user.clerkId !== currentUserId)
      .map(toPublicUser);

    res.status(200).json(availableUsers);
  } catch (error) {
    console.error("Error fetching available users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
}


exports.messageSeller = async (req, res) => {
  const { creator } = req.body;

  try {
    const user = await getAuthUser(req);
    const sellerId = await resolveSellerId(creator);

    if (!sellerId) {
      return res.status(404).json({ message: "Seller marketplace account was not found" });
    }

    const conversation = await chatService.openDirectConversation(user.id, sellerId);
    res.status(200).json({ conversation, channelId: conversation._id });
  } catch (error) {
    console.error("Error in messageSeller:", error.message);
    res.status(error.status || 500).json({ message: error.message || "Server error" });
  }
};
