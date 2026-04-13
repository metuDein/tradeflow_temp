import { useState, useRef, useCallback } from 'react'

export default function useReplay(candles) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [replayIndex, setReplayIndex] = useState(null)
    const [speed, setSpeed] = useState(1)
    const intervalRef = useRef(null)

    const speedOptions = [0.5, 1, 2, 5, 10]

    const play = useCallback(() => {
        if (candles.length === 0) return

        const startIndex = replayIndex ?? 50

        if (replayIndex === null) {
            setReplayIndex(startIndex)
        }

        setIsPlaying(true)

        intervalRef.current = setInterval(() => {
            setReplayIndex((prev) => {
                const next = (prev ?? startIndex) + 1
                if (next >= candles.length) {
                    clearInterval(intervalRef.current)
                    setIsPlaying(false)
                    return prev
                }
                return next
            })
        }, Math.max(50, 500 / speed))
    }, [candles.length, replayIndex, speed])

    const pause = useCallback(() => {
        clearInterval(intervalRef.current)
        setIsPlaying(false)
    }, [])

    const reset = useCallback(() => {
        clearInterval(intervalRef.current)
        setIsPlaying(false)
        setReplayIndex(null)
    }, [])

    const stepForward = useCallback(() => {
        setReplayIndex((prev) => {
            const next = (prev ?? 50) + 1
            return Math.min(next, candles.length - 1)
        })
    }, [candles.length])

    const stepBack = useCallback(() => {
        setReplayIndex((prev) => {
            const back = (prev ?? 50) - 1
            return Math.max(back, 0)
        })
    }, [])

    const cycleSpeed = useCallback(() => {
        setSpeed((prev) => {
            const idx = speedOptions.indexOf(prev)
            const next = speedOptions[(idx + 1) % speedOptions.length]
            if (isPlaying) {
                clearInterval(intervalRef.current)
                intervalRef.current = setInterval(() => {
                    setReplayIndex((p) => {
                        const n = (p ?? 50) + 1
                        if (n >= candles.length) {
                            clearInterval(intervalRef.current)
                            setIsPlaying(false)
                            return p
                        }
                        return n
                    })
                }, Math.max(50, 500 / next))
            }
            return next
        })
    }, [isPlaying, candles.length, speedOptions])

    const progress = candles.length > 0
        ? ((replayIndex ?? 0) / candles.length) * 100
        : 0

    const currentCandle = replayIndex !== null ? candles[replayIndex] : null

    return {
        isPlaying,
        replayIndex,
        speed,
        progress,
        currentCandle,
        play,
        pause,
        reset,
        stepForward,
        stepBack,
        cycleSpeed,
        setReplayIndex,
    }
}