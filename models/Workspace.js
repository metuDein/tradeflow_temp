import mongoose from 'mongoose'

const WorkspaceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    strategy: { type: String, required: true },
    currencyPair: { type: String, default: 'XAUUSD' },
    startDate: { type: String },
    endDate: { type: String },
    startingBalance: { type: Number, default: 10000 },
    currentBalance: { type: Number, default: 10000 },
    rules: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.Workspace || mongoose.model('Workspace', WorkspaceSchema)