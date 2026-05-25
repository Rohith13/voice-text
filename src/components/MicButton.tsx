import { motion, AnimatePresence } from 'framer-motion'

interface MicButtonProps {
  isListening: boolean
  isSupported: boolean
  onToggle: () => void
}

const MicIcon = ({ isListening }: { isListening: boolean }) => (
  <svg
    width="44"
    height="44"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Microphone body */}
    <motion.rect
      x="9"
      y="2"
      width="6"
      height="11"
      rx="3"
      fill="white"
      animate={isListening ? { scaleY: [1, 1.05, 1] } : { scaleY: 1 }}
      transition={{ duration: 0.6, repeat: isListening ? Infinity : 0, ease: 'easeInOut' }}
      style={{ transformOrigin: 'center' }}
    />
    {/* Mic stand arc */}
    <path
      d="M5 10a7 7 0 0 0 14 0"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    {/* Vertical stem */}
    <line
      x1="12"
      y1="17"
      x2="12"
      y2="21"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Base */}
    <line
      x1="8"
      y1="21"
      x2="16"
      y2="21"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

const RING_COUNT = 3

export default function MicButton({ isListening, isSupported, onToggle }: MicButtonProps) {
  return (
    <div className="mic-button-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      {/* Pulse rings container */}
      <div style={{ position: 'relative', width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {/* Animated rings (only when recording) */}
        <AnimatePresence>
          {isListening &&
            Array.from({ length: RING_COUNT }).map((_, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1.8 + i * 0.35, opacity: 0 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: 'easeOut',
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: `2px solid rgba(99, 102, 241, ${0.55 - i * 0.15})`,
                  pointerEvents: 'none',
                }}
              />
            ))}
        </AnimatePresence>

        {/* The button itself */}
        <motion.button
          onClick={isSupported ? onToggle : undefined}
          disabled={!isSupported}
          aria-label={isListening ? 'Stop recording' : 'Start recording'}
          aria-pressed={isListening}
          whileHover={isSupported ? { scale: 1.06 } : {}}
          whileTap={isSupported ? { scale: 0.94 } : {}}
          animate={
            isListening
              ? {
                  scale: [1, 1.04, 1],
                  boxShadow: [
                    '0 8px 32px rgba(99,102,241,0.45)',
                    '0 12px 48px rgba(139,92,246,0.65)',
                    '0 8px 32px rgba(99,102,241,0.45)',
                  ],
                }
              : {
                  scale: 1,
                  boxShadow: '0 8px 32px rgba(99,102,241,0.3)',
                }
          }
          transition={
            isListening
              ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.3 }
          }
          style={{
            position: 'relative',
            width: 120,
            height: 120,
            borderRadius: '50%',
            border: 'none',
            cursor: isSupported ? 'pointer' : 'not-allowed',
            background: isListening
              ? 'linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #4f46e5 100%)'
              : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 'none',
            zIndex: 1,
            opacity: isSupported ? 1 : 0.45,
          }}
        >
          {/* Inner glow ring */}
          <span
            style={{
              position: 'absolute',
              inset: 4,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              pointerEvents: 'none',
            }}
          />

          <MicIcon isListening={isListening} />

          {/* Recording indicator dot */}
          <AnimatePresence>
            {isListening && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#ef4444',
                  boxShadow: '0 0 8px rgba(239,68,68,0.8)',
                }}
              />
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Label beneath button */}
      <motion.div
        style={{ textAlign: 'center' }}
        animate={{ opacity: 1 }}
        initial={{ opacity: 0 }}
      >
        <motion.p
          key={isListening ? 'recording' : 'idle'}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          style={{
            fontSize: '0.9rem',
            fontWeight: 500,
            letterSpacing: '0.04em',
            color: isListening ? '#a78bfa' : '#94a3b8',
            textTransform: 'uppercase',
          }}
        >
          {!isSupported
            ? 'Not supported in this browser'
            : isListening
              ? 'Recording…'
              : 'Click to start'}
        </motion.p>

        {!isSupported && (
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
            Use Chrome or Edge for Web Speech API
          </p>
        )}
      </motion.div>
    </div>
  )
}
