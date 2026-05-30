import { motion } from 'framer-motion'

export type CaptureMode = 'microphone' | 'screen' | 'video'

interface ModeSelectorProps {
  mode: CaptureMode
  onChange: (mode: CaptureMode) => void
}

export default function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(99,102,241,0.15)',
        borderRadius: 12,
        padding: 4,
      }}
    >
      {(['microphone', 'screen', 'video'] as CaptureMode[]).map(m => (
        <button
          key={m}
          onClick={() => onChange(m)}
          style={{
            position: 'relative',
            background: 'transparent',
            border: 'none',
            borderRadius: 9,
            padding: '7px 16px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: mode === m ? '#e2e8f0' : '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            transition: 'color 0.2s',
            zIndex: 1,
          }}
        >
          {mode === m && (
            <motion.span
              layoutId="mode-pill"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.25))',
                border: '1px solid rgba(99,102,241,0.35)',
                borderRadius: 9,
                zIndex: -1,
              }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            />
          )}
          {m === 'microphone' ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="9" y="2" width="6" height="11" rx="3" />
              <path d="M5 10a7 7 0 0 0 14 0" />
              <line x1="12" y1="17" x2="12" y2="21" />
              <line x1="8" y1="21" x2="16" y2="21" />
            </svg>
          ) : m === 'screen' ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" />
            </svg>
          )}
          {m === 'microphone' ? 'Microphone' : m === 'screen' ? 'Screen Audio' : 'Video URL'}
        </button>
      ))}
    </div>
  )
}
