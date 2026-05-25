import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface WaveformBarsProps {
  isListening: boolean
  barCount?: number
}

// Pre-compute stable random values so bars don't reshuffle on re-renders
function useStableBarConfig(count: number) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        minH: 4 + Math.random() * 6,
        maxH: 20 + Math.random() * 44,
        duration: 0.35 + Math.random() * 0.55,
        delay: (i / count) * 0.6 + Math.random() * 0.15,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count],
  )
}

export default function WaveformBars({ isListening, barCount = 28 }: WaveformBarsProps) {
  const bars = useStableBarConfig(barCount)

  return (
    <div
      aria-hidden="true"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        height: 72,
        padding: '0 8px',
      }}
    >
      {bars.map((bar, i) => (
        <motion.div
          key={i}
          animate={
            isListening
              ? {
                  height: [bar.minH, bar.maxH, bar.minH * 1.4, bar.maxH * 0.8, bar.minH],
                  opacity: [0.55, 1, 0.8, 1, 0.55],
                }
              : {
                  height: 4,
                  opacity: 0.2,
                }
          }
          transition={
            isListening
              ? {
                  duration: bar.duration,
                  repeat: Infinity,
                  delay: bar.delay,
                  ease: 'easeInOut',
                  repeatType: 'mirror',
                }
              : {
                  duration: 0.4,
                  ease: 'easeOut',
                }
          }
          style={{
            width: 3,
            minHeight: 4,
            borderRadius: 99,
            background: isListening
              ? `linear-gradient(180deg, #a78bfa 0%, #6366f1 100%)`
              : '#1e2740',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  )
}
