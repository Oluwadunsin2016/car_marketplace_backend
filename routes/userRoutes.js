const express = require('express');
const { getToken, messageSeller,getAvailableUsers } = require('../controllers/userController');
const router = express.Router();

// Route to save car information
router.get('/get-token/:userId',getToken);
router.post('/message-seller',messageSeller);
router.get('/getAvailableUsers',getAvailableUsers);

module.exports = router;
