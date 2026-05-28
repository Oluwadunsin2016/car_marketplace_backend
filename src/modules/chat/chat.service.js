const mongoose = require('mongoose');
const { Conversation, Message, User } = require('../../models');
const { deleteFileByPublicId, uploadFile } = require('../uploads/upload.service');

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value));

const objectId = (value) => new mongoose.Types.ObjectId(String(value));

const getAttachmentType = (mimeType = '') => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'file';
};

const getMessageType = (text = '', attachments = []) => {
  if (!attachments.length) return 'text';
  const types = [...new Set(attachments.map((attachment) => attachment.type))];
  if (text.trim() || types.length > 1) return 'mixed';
  return types[0] || 'file';
};

const toChatUser = (user) => ({
  _id: String(user._id),
  id: user.clerkId,
  appUserId: String(user._id),
  name: user.name,
  username: user.email,
  email: user.email,
  imageUrl: user.imageUrl,
  lastSeen: user.lastSyncedAt,
});

const serializeReaction = (reaction) => ({
  user: String(reaction.user),
  userId: String(reaction.user),
  emoji: reaction.emoji,
  createdAt: reaction.createdAt,
});

const serializeMessage = async (message) => {
  const populated = message.sender?.name
    ? message
    : await Message.findById(message._id).populate('sender').populate('replyTo');
  const replyTo = populated.replyTo?._id ? populated.replyTo : null;

  return {
    _id: String(populated._id),
    conversation: String(populated.conversation),
    sender: populated.sender ? toChatUser(populated.sender) : null,
    text: populated.text,
    attachments: populated.attachments || [],
    messageType: populated.messageType,
    readBy: (populated.readBy || []).map(String),
    replyTo: replyTo ? await serializeMessage(replyTo) : null,
    reactions: (populated.reactions || []).map(serializeReaction),
    pinnedBy: (populated.pinnedBy || []).map(String),
    deletedForEveryone: populated.deletedForEveryone,
    isForwarded: populated.isForwarded,
    forwardedFrom: populated.forwardedFrom
      ? {
          message: populated.forwardedFrom.message ? String(populated.forwardedFrom.message) : null,
          messageId: populated.forwardedFrom.message ? String(populated.forwardedFrom.message) : null,
          sender: populated.forwardedFrom.sender ? String(populated.forwardedFrom.sender) : null,
          senderId: populated.forwardedFrom.sender ? String(populated.forwardedFrom.sender) : null,
        }
      : null,
    isEdited: populated.isEdited,
    editedAt: populated.editedAt,
    createdAt: populated.createdAt,
    updatedAt: populated.updatedAt,
  };
};

const serializeConversation = async (conversation) => {
  const populated = await Conversation.findById(conversation._id)
    .populate('members')
    .populate({
      path: 'lastMessage',
      populate: { path: 'sender replyTo' },
    });

  return {
    _id: String(populated._id),
    type: populated.type,
    members: populated.members.map(toChatUser),
    lastMessage: populated.lastMessage ? await serializeMessage(populated.lastMessage) : null,
    lastMessageAt: populated.lastMessageAt,
    createdAt: populated.createdAt,
    updatedAt: populated.updatedAt,
  };
};

const findDirectConversation = (currentUserId, recipientId) => {
  return Conversation.findOne({
    type: 'direct',
    members: { $all: [objectId(currentUserId), objectId(recipientId)], $size: 2 },
  });
};

const openDirectConversation = async (currentUserId, recipientId) => {
  if (!recipientId || !isObjectId(recipientId)) {
    const error = new Error('Recipient ID is required');
    error.status = 400;
    throw error;
  }
  if (String(currentUserId) === String(recipientId)) {
    const error = new Error('You cannot message yourself');
    error.status = 400;
    throw error;
  }

  const recipient = await User.findById(recipientId);
  if (!recipient) {
    const error = new Error('Recipient not found');
    error.status = 404;
    throw error;
  }

  const existingConversation = await findDirectConversation(currentUserId, recipientId);
  if (existingConversation) return serializeConversation(existingConversation);

  const conversation = await Conversation.create({
    members: [objectId(currentUserId), objectId(recipientId)],
    lastMessageAt: new Date(),
  });

  return serializeConversation(conversation);
};

const listConversations = async (userId) => {
  const conversations = await Conversation.find({ members: objectId(userId) }).sort({
    lastMessageAt: -1,
    updatedAt: -1,
  });

  return Promise.all(
    conversations.map(async (conversation) => {
      const serialized = await serializeConversation(conversation);
      serialized.unreadCount = await Message.countDocuments({
        conversation: conversation._id,
        sender: { $ne: objectId(userId) },
        readBy: { $ne: objectId(userId) },
      });
      return serialized;
    })
  );
};

const getMessages = async (userId, conversationId, { page = 1, limit = 30 } = {}) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    members: objectId(userId),
  });
  if (!conversation) {
    const error = new Error('Conversation not found');
    error.status = 404;
    throw error;
  }

  const pageNumber = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(limit) || 30, 1), 60);
  const skip = (pageNumber - 1) * pageSize;
  const [count, rows] = await Promise.all([
    Message.countDocuments({ conversation: conversation._id }),
    Message.find({ conversation: conversation._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('sender')
      .populate('replyTo'),
  ]);

  return {
    messages: await Promise.all(rows.reverse().map(serializeMessage)),
    hasMore: skip + rows.length < count,
  };
};

const uploadAttachments = async (files = []) => {
  const results = await Promise.allSettled(
    files.map(async (file) => {
      const result = await uploadFile(file, {
        folder: 'car-marketplace/message-attachments',
        resourceType: 'auto',
      });

      return {
        url: result.url,
        publicId: result.publicId,
        resourceType: result.resourceType,
        type: getAttachmentType(file.mimetype),
        mimeType: file.mimetype,
        name: file.originalname,
        size: file.size,
      };
    })
  );

  const uploadedAttachments = results
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);
  const failedUpload = results.find((result) => result.status === 'rejected');

  if (failedUpload) {
    await Promise.allSettled(
      uploadedAttachments.map((attachment) =>
        deleteFileByPublicId(attachment.publicId, attachment.resourceType || 'image')
      )
    );
    throw failedUpload.reason;
  }

  return uploadedAttachments;
};

const deleteAttachmentsIfUnreferenced = async (attachments = []) => {
  const uniqueAttachments = attachments.filter((attachment, index, allAttachments) => {
    if (!attachment.publicId) return false;
    return allAttachments.findIndex((item) => item.publicId === attachment.publicId) === index;
  });

  await Promise.allSettled(
    uniqueAttachments.map(async (attachment) => {
      const referenceCount = await Message.countDocuments({ 'attachments.publicId': attachment.publicId });
      if (referenceCount === 0) {
        await deleteFileByPublicId(attachment.publicId, attachment.resourceType || 'image');
      }
    })
  );
};

const sendMessage = async (userId, conversationId, payload, files = []) => {
  const text = payload?.text?.trim() || '';
  if (!text && files.length === 0) {
    const error = new Error('Message text or attachment is required');
    error.status = 400;
    throw error;
  }

  const conversation = await Conversation.findOne({
    _id: conversationId,
    members: objectId(userId),
  });
  if (!conversation) {
    const error = new Error('Conversation not found');
    error.status = 404;
    throw error;
  }

  const attachments = await uploadAttachments(files);
  let message;

  try {
    message = await Message.create({
      conversation: conversation._id,
      sender: objectId(userId),
      text,
      attachments,
      messageType: getMessageType(text, attachments),
      replyTo: payload?.replyTo && isObjectId(payload.replyTo) ? objectId(payload.replyTo) : null,
      readBy: [objectId(userId)],
    });
  } catch (error) {
    await Promise.allSettled(
      attachments.map((attachment) => deleteFileByPublicId(attachment.publicId, attachment.resourceType || 'image'))
    );
    throw error;
  }

  conversation.set({
    lastMessage: message._id,
    lastMessageAt: message.createdAt,
  });
  await conversation.save();

  return {
    message: await serializeMessage(message),
    conversation: await serializeConversation(conversation),
  };
};

const markConversationRead = async (userId, conversationId) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    members: objectId(userId),
  });
  if (!conversation) {
    const error = new Error('Conversation not found');
    error.status = 404;
    throw error;
  }

  await Message.updateMany(
    {
      conversation: conversation._id,
      sender: { $ne: objectId(userId) },
      readBy: { $ne: objectId(userId) },
    },
    { $addToSet: { readBy: objectId(userId) } }
  );

  return { conversation: await serializeConversation(conversation) };
};

const editMessage = async (userId, messageId, text) => {
  const nextText = text?.trim();
  if (!nextText) {
    const error = new Error('Message text is required');
    error.status = 400;
    throw error;
  }

  const message = await Message.findById(messageId);
  if (!message || String(message.sender) !== String(userId)) {
    const error = new Error('Message not found or not editable');
    error.status = 403;
    throw error;
  }

  message.set({ text: nextText, isEdited: true, editedAt: new Date() });
  await message.save();
  const conversation = await Conversation.findById(message.conversation);
  return { message: await serializeMessage(message), conversation: await serializeConversation(conversation) };
};

const deleteMessage = async (userId, messageId) => {
  const message = await Message.findById(messageId);
  if (!message || String(message.sender) !== String(userId)) {
    const error = new Error('Message not found or not deletable');
    error.status = 403;
    throw error;
  }

  const attachmentsToDelete = [...(message.attachments || [])];

  message.set({
    text: 'This message was deleted',
    attachments: [],
    reactions: [],
    deletedForEveryone: true,
    isEdited: false,
    editedAt: null,
  });
  await message.save();
  await deleteAttachmentsIfUnreferenced(attachmentsToDelete);
  const conversation = await Conversation.findById(message.conversation);
  return { message: await serializeMessage(message), conversation: await serializeConversation(conversation) };
};

const toggleReaction = async (userId, messageId, emoji) => {
  const message = await Message.findById(messageId);
  if (!message) {
    const error = new Error('Message not found');
    error.status = 404;
    throw error;
  }

  const reactions = [...(message.reactions || [])];
  const index = reactions.findIndex((reaction) => String(reaction.user) === String(userId));
  if (index >= 0 && reactions[index].emoji === emoji) reactions.splice(index, 1);
  else if (index >= 0) reactions[index] = { user: objectId(userId), emoji, createdAt: new Date() };
  else reactions.push({ user: objectId(userId), emoji, createdAt: new Date() });

  message.reactions = reactions;
  await message.save();
  const conversation = await Conversation.findById(message.conversation);
  return { message: await serializeMessage(message), conversation: await serializeConversation(conversation) };
};

const togglePin = async (userId, messageId) => {
  const message = await Message.findById(messageId);
  if (!message) {
    const error = new Error('Message not found');
    error.status = 404;
    throw error;
  }

  const alreadyPinned = (message.pinnedBy || []).some((id) => String(id) === String(userId));
  if (alreadyPinned) message.pinnedBy = message.pinnedBy.filter((id) => String(id) !== String(userId));
  else message.pinnedBy.push(objectId(userId));

  await message.save();
  const conversation = await Conversation.findById(message.conversation);
  return { message: await serializeMessage(message), conversation: await serializeConversation(conversation) };
};

const cloneAttachments = (attachments = []) => {
  return attachments.map((attachment) => ({
    url: attachment.url,
    publicId: attachment.publicId || null,
    resourceType: attachment.resourceType || null,
    type: attachment.type || 'file',
    mimeType: attachment.mimeType || '',
    name: attachment.name || 'Attachment',
    size: attachment.size || 0,
  }));
};

const forwardMessage = async (userId, messageId, recipientIds = []) => {
  const normalizedRecipientIds = [...new Set(recipientIds.map(String))]
    .filter((recipientId) => isObjectId(recipientId) && recipientId !== String(userId));

  if (normalizedRecipientIds.length === 0) {
    const error = new Error('Select at least one destination');
    error.status = 400;
    throw error;
  }

  const originalMessage = await Message.findById(messageId);
  if (!originalMessage) {
    const error = new Error('Message not found');
    error.status = 404;
    throw error;
  }

  const sourceConversation = await Conversation.findOne({
    _id: originalMessage.conversation,
    members: objectId(userId),
  });
  if (!sourceConversation) {
    const error = new Error('You do not belong to this conversation');
    error.status = 403;
    throw error;
  }
  if (originalMessage.deletedForEveryone) {
    const error = new Error('Deleted messages cannot be forwarded');
    error.status = 400;
    throw error;
  }

  const messages = [];
  const conversations = [];

  for (const recipientId of normalizedRecipientIds) {
    const conversationRecord =
      (await findDirectConversation(userId, recipientId)) ||
      (await Conversation.create({
        members: [objectId(userId), objectId(recipientId)],
        lastMessageAt: new Date(),
      }));

    const forwardedMessage = await Message.create({
      conversation: conversationRecord._id,
      sender: objectId(userId),
      text: originalMessage.text || '',
      attachments: cloneAttachments(originalMessage.attachments || []),
      messageType: originalMessage.messageType,
      readBy: [objectId(userId)],
      isForwarded: true,
      forwardedFrom: {
        message: originalMessage._id,
        sender: originalMessage.sender,
      },
    });

    conversationRecord.set({
      lastMessage: forwardedMessage._id,
      lastMessageAt: forwardedMessage.createdAt,
    });
    await conversationRecord.save();

    messages.push(await serializeMessage(forwardedMessage));
    conversations.push(await serializeConversation(conversationRecord));
  }

  return { messages, conversations };
};

module.exports = {
  editMessage,
  deleteMessage,
  forwardMessage,
  getMessages,
  listConversations,
  markConversationRead,
  openDirectConversation,
  sendMessage,
  togglePin,
  toggleReaction,
};
