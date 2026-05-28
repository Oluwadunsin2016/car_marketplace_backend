const express = require('express');
const { messageSeller, getAvailableUsers, getCurrentUser, getPublicUserProfile, updateCurrentUser } = require('./user.controller');
const { requireAuth } = require('../../middleware/auth');
const { imageUpload } = require('../../middleware/upload');
const { validateRequest } = require('../../middleware/validateRequest');
const { messageSellerSchema, updateCurrentUserSchema } = require('./user.validation');
const router = express.Router();

router.get('/me', requireAuth, getCurrentUser);
router.patch('/me', requireAuth, imageUpload.single('image'), validateRequest({ body: updateCurrentUserSchema }), updateCurrentUser);
router.get('/profile/:id', getPublicUserProfile);
router.post('/message-seller',requireAuth,validateRequest({ body: messageSellerSchema }),messageSeller);
router.get('/getAvailableUsers',requireAuth,getAvailableUsers);

module.exports = router;
