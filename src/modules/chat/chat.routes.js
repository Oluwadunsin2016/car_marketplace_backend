const express = require('express');
const chatController = require('./chat.controller');
const { requireAuth } = require('../../middleware/auth');
const { fileUpload } = require('../../middleware/upload');

const router = express.Router();

router.use(requireAuth);

router.get('/conversations', chatController.listConversations);
router.post('/conversations/direct', chatController.openDirectConversation);
router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.post('/conversations/:conversationId/messages', fileUpload.array('files', 6), chatController.sendMessage);
router.post('/conversations/:conversationId/read', chatController.markConversationRead);
router.patch('/messages/:messageId', chatController.editMessage);
router.delete('/messages/:messageId', chatController.deleteMessage);
router.post('/messages/:messageId/reactions', chatController.toggleReaction);
router.post('/messages/:messageId/pin', chatController.togglePin);
router.post('/messages/:messageId/forward', chatController.forwardMessage);

module.exports = router;
