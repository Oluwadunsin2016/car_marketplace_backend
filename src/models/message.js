const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: null },
    resourceType: { type: String, enum: ['image', 'video', 'raw'], default: 'image' },
    type: { type: String, enum: ['image', 'video', 'audio', 'file'], default: 'file' },
    mimeType: { type: String, default: '' },
    name: { type: String, default: '' },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const reactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    emoji: { type: String, required: true, maxlength: 12 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, default: '', trim: true, maxlength: 4000 },
    attachments: [attachmentSchema],
    messageType: { type: String, enum: ['text', 'image', 'video', 'audio', 'file', 'mixed'], default: 'text' },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    reactions: [reactionSchema],
    pinnedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    deletedForEveryone: { type: Boolean, default: false },
    isForwarded: { type: Boolean, default: false },
    forwardedFrom: {
      message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

messageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
