import mongoose from 'mongoose'

const TradeSchema = new mongoose.Schema({
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    direction: { type: String, enum: ['BUY', 'SELL'], required: true },
    execType: { type: String, enum: ['Market', 'Limit', 'Stop'], default: 'Market' },
    entryPrice: { type: Number, required: true },
    exitPrice: { type: Number },
    stopLoss: { type: Number, required: true },
    takeProfit: { type: Number, required: true },
    tp2: { type: Number },
    tp3: { type: Number },
    lotSize: { type: Number, default: 0.1 },
    status: { type: String, enum: ['open', 'closed', 'cancelled'], default: 'open' },
    outcome: { type: String, enum: ['win', 'loss', 'breakeven', null], default: null },
    pnl: { type: Number, default: 0 },
    riskRewardRatio: { type: Number },
    strategy: { type: String },
    timeframe: { type: String },
    entryTime: { type: Date, default: Date.now },
    exitTime: { type: Date },
    screenshot: { type: String },
    notes: { type: String },
    aiAnalysis: { type: String },
    deviations: [{ type: String }],
    tags: [{ type: String }],
})

export default mongoose.models.Trade || mongoose.model('Trade', TradeSchema)