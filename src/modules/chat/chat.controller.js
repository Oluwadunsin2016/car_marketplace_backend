const mongoose = require('mongoose');
const chatService = require('./chat.service');
const { emitToConversationMembers } = require('../../socket');
const { getCurrentMarketplaceUser } = require('../users/user.service');
const { User } = require('../../models');

const getCurrentUser = async (req) => getCurrentMarketplaceUser(req.auth.userId);

const resolveRecipientId = async (body = {}) => {
  const candidate = body.recipientId || body.creator?.appUserId || body.creator?.id;
  if (candidate && mongoose.Types.ObjectId.isValid(String(candidate))) return String(candidate);

  const filters = [];
  if (candidate) filters.push({ clerkId: candidate });
  if (body.creator?.email) filters.push({ email: body.creator.email });

  if (filters.length === 0) return null;

  const recipient = await User.findOne({ $or: filters });
  return recipient?._id?.toString() || null;
};

exports.openDirectConversation = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req);
    const recipientId = await resolveRecipientId(req.body);
    const conversation = await chatService.openDirectConversation(user.id, recipientId);
    res.status(200).json({ conversation, channelId: conversation._id });
  } catch (error) {
    next(error);
  }
};

exports.listConversations = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req);
    const conversations = await chatService.listConversations(user.id);
    res.status(200).json({ conversations });
  } catch (error) {
    next(error);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req);
    const result = await chatService.getMessages(user.id, req.params.conversationId, req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req);
    const { message, conversation } = await chatService.sendMessage(user.id, req.params.conversationId, req.body, req.files);
    emitToConversationMembers(conversation, 'message:new', { message, conversationId: conversation._id });
    emitToConversationMembers(conversation, 'conversation:updated', { conversation });
    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
};

exports.markConversationRead = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req);
    const { conversation } = await chatService.markConversationRead(user.id, req.params.conversationId);
    emitToConversationMembers(conversation, 'message:read', { conversationId: conversation._id, readerId: String(user.id) });
    res.status(200).json({ message: 'Conversation marked as read' });
  } catch (error) {
    next(error);
  }
};

exports.editMessage = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req);
    const { message, conversation } = await chatService.editMessage(user.id, req.params.messageId, req.body.text);
    emitToConversationMembers(conversation, 'message:updated', { message, conversationId: conversation._id });
    emitToConversationMembers(conversation, 'conversation:updated', { conversation });
    res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
};

exports.deleteMessage = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req);
    const { message, conversation } = await chatService.deleteMessage(user.id, req.params.messageId);
    emitToConversationMembers(conversation, 'message:updated', { message, conversationId: conversation._id });
    emitToConversationMembers(conversation, 'conversation:updated', { conversation });
    res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
};

exports.toggleReaction = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req);
    const { message, conversation } = await chatService.toggleReaction(user.id, req.params.messageId, req.body.emoji);
    emitToConversationMembers(conversation, 'message:updated', { message, conversationId: conversation._id });
    res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
};

exports.togglePin = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req);
    const { message, conversation } = await chatService.togglePin(user.id, req.params.messageId);
    emitToConversationMembers(conversation, 'message:updated', { message, conversationId: conversation._id });
    res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
};

exports.forwardMessage = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req);
    const { messages, conversations } = await chatService.forwardMessage(
      user.id,
      req.params.messageId,
      req.body.privateUserIds || req.body.recipientIds || []
    );

    conversations.forEach((conversation) => {
      const message = messages.find((item) => item.conversation === conversation._id);
      if (!message) return;
      emitToConversationMembers(conversation, 'message:new', { message, conversationId: conversation._id });
      emitToConversationMembers(conversation, 'conversation:updated', { conversation });
    });

    res.status(200).json({ message: 'Message forwarded successfully', messages });
  } catch (error) {
    next(error);
  }
};
