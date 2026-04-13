import mongoose from 'mongoose'

const CandleCacheSchema = new mongoose.Schema({
    symbol: { type: String, required: true },
    interval: { type: String, required: true },
    date: { type: String, required: true },
    candles: { type: Array, required: true },
    fetchedAt: { type: Date, default: Date.now },
})

CandleCacheSchema.index({ symbol: 1, interval: 1, date: 1 }, { unique: true })

export default mongoose.models.CandleCache || mongoose.model('CandleCache', CandleCacheSchema)