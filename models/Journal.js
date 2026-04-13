import mongoose from 'mongoose'

const JournalSchema = new mongoose.Schema({
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tradeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trade' },
    type: { type: String, enum: ['auto', 'manual'], default: 'auto' },
    title: { type: String },
    content: { type: String },
    screenshot: { type: String },
    aiSummary: { type: String },
    mood: { type: String, enum: ['confident', 'uncertain', 'neutral', 'anxious'] },
    createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.Journal || mongoose.model('Journal', JournalSchema)