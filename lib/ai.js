import Groq from 'groq-sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

async function analyzeWithGroq(prompt) {
    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
            {
                role: 'system',
                content: `You are an expert trading coach specializing in XAUUSD (Gold). 
        You analyze trades, identify patterns, and give concise actionable feedback. 
        Keep responses under 150 words. Be direct and specific.`
            },
            { role: 'user', content: prompt }
        ],
        max_tokens: 300,
    })
    return response.choices[0].message.content
}

async function analyzeWithGemini(prompt) {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    return result.response.text()
}

export async function analyzeTradeAI(trade, workspaceRules) {
    const prompt = `
    Analyze this XAUUSD trade:
    - Direction: ${trade.direction}
    - Entry: ${trade.entryPrice}
    - Exit: ${trade.exitPrice || 'still open'}
    - Stop Loss: ${trade.stopLoss}
    - Take Profit: ${trade.takeProfit}
    - Outcome: ${trade.outcome || 'pending'}
    - P&L: ${trade.pnl}
    - Risk:Reward: ${trade.riskRewardRatio}
    - Timeframe: ${trade.timeframe}
    - Strategy rules: ${workspaceRules?.join(', ') || 'none defined'}
    
    Give specific feedback on: entry quality, SL/TP placement, 
    strategy adherence, and one improvement tip.
  `

    try {
        return await analyzeWithGroq(prompt)
    } catch (error) {
        console.error('Groq failed, falling back to Gemini:', error)
        return await analyzeWithGemini(prompt)
    }
}

export async function checkStrategyDeviation(trade, workspaceRules) {
    if (!workspaceRules || workspaceRules.length === 0) return []

    const prompt = `
    Trading rules: ${workspaceRules.join(', ')}
    
    Trade taken:
    - Direction: ${trade.direction}
    - Timeframe: ${trade.timeframe}
    - Entry price: ${trade.entryPrice}
    - Strategy tag: ${trade.strategy}
    
    List ONLY the rules this trade violates, one per line.
    If no violations, respond with: "No deviations detected"
    Keep each violation under 15 words.
  `

    try {
        const result = await analyzeWithGroq(prompt)
        if (result.includes('No deviations')) return []
        return result.split('\n').filter(line => line.trim().length > 0)
    } catch {
        return []
    }
}

export async function generateJournalSummary(trades) {
    const prompt = `
    Summarize these ${trades.length} recent XAUUSD trades:
    ${trades.map(t => `${t.direction} ${t.outcome} ${t.pnl > 0 ? '+' : ''}$${t.pnl}`).join(', ')}
    
    Give a 3-sentence coaching summary: what's working, what needs improvement, 
    and one specific action to take next session.
  `

    try {
        return await analyzeWithGroq(prompt)
    } catch {
        return await analyzeWithGemini(prompt)
    }
}